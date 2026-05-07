// src/modules/hr-calendar/hr-calendar.service.ts
import { db } from "../../db/drizzle";
import {
  attendance,
  users,
  leaves,
  workspaceMembers,
  teams,
  leaveTypes,
} from "../../db/schema";
import { eq, and, gte, lte, count, inArray } from "drizzle-orm";

export class HRCalendarService {
  /**
   * Get all HR calendar events for a workspace
   */
  async getHREvents(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId: string | null,
    month?: number,
    year?: number,
  ) {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = year || now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const canManageAll =
      userPermissions.includes("user_management") ||
      userPermissions.includes("hr_calendar");

    // HR Calendar: Only accessible by user_management OR hr_calendar
    if (!canManageAll) {
      return {
        attendance: [],
        leaves: [],
        holidays: [],
        hasAccess: false,
      };
    }

    // HR Calendar: Show ALL data (no team filtering for admins/HR)
    const attendanceEvents = await this.getDailyAttendanceSummary(
      workspaceId,
      userId,
      startDate,
      endDate,
      true,
      [],
    );

    const leaveEvents = await this.getLeaveEvents(
      workspaceId,
      userId,
      startDate,
      endDate,
      true,
      [],
    );

    const holidayEvents = await this.getHolidayEvents(targetMonth, targetYear);

    return {
      attendance: attendanceEvents,
      leaves: leaveEvents,
      holidays: holidayEvents,
      hasAccess: true,
    };
  }

  /**
   * Get daily attendance summary for each day of the month (filtered by permissions)
   */
  private async getDailyAttendanceSummary(
    workspaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    canManageAll: boolean,
    teamMemberIds: string[],
  ) {
    // Build conditions with permission filtering
    const memberConditions: any[] = [
      eq(workspaceMembers.workspaceId, workspaceId),
    ];

    if (!canManageAll) {
      if (teamMemberIds.length > 0) {
        memberConditions.push(inArray(workspaceMembers.userId, teamMemberIds));
      } else {
        memberConditions.push(eq(workspaceMembers.userId, userId));
      }
    }

    // Get total members (filtered by permissions)
    const [totalMembers] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .where(and(...memberConditions));

    const total = totalMembers?.count || 0;

    // Build attendance conditions with same permission filter
    const attendanceConditions: any[] = [
      eq(attendance.workspaceId, workspaceId),
      gte(attendance.date, startDate),
      lte(attendance.date, endDate),
    ];

    if (!canManageAll) {
      if (teamMemberIds.length > 0) {
        attendanceConditions.push(inArray(attendance.userId, teamMemberIds));
      } else {
        attendanceConditions.push(eq(attendance.userId, userId));
      }
    }

    // Get all attendance records for the month
    const records = await db
      .select({
        date: attendance.date,
        status: attendance.status,
      })
      .from(attendance)
      .where(and(...attendanceConditions));

    // Group by date
    const dateMap = new Map<
      string,
      {
        present: number;
        absent: number;
        onLeave: number;
        halfDay: number;
      }
    >();

    records.forEach((record) => {
      const dateKey = new Date(record.date).toISOString().split("T")[0];

      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, { present: 0, absent: 0, onLeave: 0, halfDay: 0 });
      }

      const stats = dateMap.get(dateKey)!;

      switch (record.status) {
        case "PRESENT":
        case "LATE":
          stats.present++;
          break;
        case "ABSENT":
          stats.absent++;
          break;
        case "ON_LEAVE":
          stats.onLeave++;
          break;
        case "HALF_DAY":
          stats.halfDay++;
          break;
      }
    });

    // Convert to events
    const events: any[] = [];

    dateMap.forEach((stats, dateKey) => {
      const attendancePercentage =
        total > 0
          ? Math.round(((stats.present + stats.halfDay) / total) * 100)
          : 0;

      let backgroundColor = "#10b981"; // Green for good attendance
      if (attendancePercentage < 60) {
        backgroundColor = "#ef4444"; // Red for low attendance
      } else if (attendancePercentage < 80) {
        backgroundColor = "#f59e0b"; // Amber for moderate attendance
      }

      events.push({
        id: `att-${dateKey}`,
        title:
          attendancePercentage < 80
            ? "Low Attendance Alert"
            : "Daily Attendance",
        start: dateKey,
        allDay: true,
        backgroundColor,
        borderColor: backgroundColor,
        extendedProps: {
          type: "attendance",
          present: stats.present,
          absent: stats.absent,
          onLeave: stats.onLeave,
          halfDay: stats.halfDay,
          total,
          attendancePercentage,
          category: "attendance",
        },
      });
    });

    return events;
  }

  /**
   * Get approved leave events (filtered by permissions)
   */
  private async getLeaveEvents(
    workspaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
    canManageAll: boolean,
    teamMemberIds: string[],
  ) {
    const leaveConditions: any[] = [
      eq(leaves.workspaceId, workspaceId),
      eq(leaves.status, "APPROVED"),
      gte(leaves.endDate, startDate),
      lte(leaves.startDate, endDate),
    ];

    // Filter leaves by user visibility
    if (!canManageAll) {
      if (teamMemberIds.length > 0) {
        // Include team members + self
        const visibleUserIds = [...teamMemberIds, userId];
        leaveConditions.push(inArray(leaves.userId, visibleUserIds));
      } else {
        // Only own leaves
        leaveConditions.push(eq(leaves.userId, userId));
      }
    }

    // FIXED: Join with leaveTypes to get dynamic leave type name and color
    const approvedLeaves = await db
      .select({
        id: leaves.id,
        userId: leaves.userId,
        startDate: leaves.startDate,
        endDate: leaves.endDate,
        leaveTypeId: leaves.leaveTypeId, // FIXED: Changed from type
        leaveTypeName: leaveTypes.name, // FIXED: Get name from leaveTypes
        leaveTypeColor: leaveTypes.color, // FIXED: Get color from leaveTypes
        reason: leaves.reason,
        userName: users.name,
        teamName: teams.name,
      })
      .from(leaves)
      .leftJoin(users, eq(leaves.userId, users.id))
      .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id)) // FIXED: Join with leaveTypes
      .where(and(...leaveConditions));

    return approvedLeaves.map((leave) => {
      const leaveTypeName = leave.leaveTypeName || "Leave";
      const leaveColor = leave.leaveTypeColor || "#3b82f6";

      return {
        id: `leave-${leave.id}`,
        title: `${leave.userName} - ${leaveTypeName}`, // FIXED: Use dynamic name
        start: new Date(leave.startDate).toISOString().split("T")[0],
        end: new Date(
          new Date(leave.endDate).setDate(
            new Date(leave.endDate).getDate() + 1,
          ),
        )
          .toISOString()
          .split("T")[0],
        backgroundColor: leaveColor, // FIXED: Use color from DB
        borderColor: leaveColor, // FIXED: Use color from DB
        extendedProps: {
          type: "leave",
          employee: leave.userName,
          department: leave.teamName || "N/A",
          leaveType: leaveTypeName, // FIXED: Use dynamic name
          leaveTypeId: leave.leaveTypeId,
          reason: leave.reason,
          category: "leave",
        },
      };
    });
  }

  /**
   * Get holiday events
   */
  private async getHolidayEvents(month: number, year: number) {
    const holidays: Record<string, string> = {
      "2026-01-26": "Republic Day",
      "2026-04-03": "Good Friday",
      "2026-04-14": "Ambedkar Jayanti",
      "2026-05-01": "Labour Day",
      "2026-08-15": "Independence Day",
      "2026-10-02": "Gandhi Jayanti",
      "2026-12-25": "Christmas",
    };

    const events: any[] = [];

    Object.entries(holidays).forEach(([date, name]) => {
      const holidayDate = new Date(date);
      if (
        holidayDate.getMonth() + 1 === month &&
        holidayDate.getFullYear() === year
      ) {
        events.push({
          id: `holiday-${date}`,
          title: `${name} - Company Holiday`,
          start: date,
          allDay: true,
          backgroundColor: "#eab308",
          borderColor: "#eab308",
          extendedProps: {
            type: "holiday",
            category: "holiday",
          },
        });
      }
    });

    return events;
  }
}
