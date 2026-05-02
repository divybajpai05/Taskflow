// src/modules/hr-dashboard/hr-dashboard.service.ts
import { db } from "../../db/drizzle";
import {
  users,
  workspaceMembers,
  attendance,
  leaves,
  teams,
  roles,
} from "../../db/schema";
import { eq, and, gte, lte, count, sql } from "drizzle-orm";

export class HRDashboardService {
  /**
   * Get KPI numbers for HR Dashboard
   */
  async getKPIData(
    workspaceId: string,
    department?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const now = new Date();

    // ✅ Use provided dates or default to today
    const todayStart = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = dateTo
      ? new Date(dateTo + "T23:59:59")
      : new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const deptFilter =
      department && department !== "all" ? [eq(teams.name, department)] : [];

    // Total employees
    const [totalEmp] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), ...deptFilter));

    // Active employees
    const [activeEmp] = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
          ...deptFilter,
        ),
      );

    // ✅ On Leave - Head Count (unique employees) for the selected date range
    const leaveUserIds = await db
      .select({ userId: leaves.userId })
      .from(leaves)
      .where(
        and(
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          lte(leaves.startDate, todayEnd),
          gte(leaves.endDate, todayStart),
        ),
      )
      .groupBy(leaves.userId);

    const attendanceLeaveUserIds = await db
      .select({ userId: attendance.userId })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          eq(attendance.status, "ON_LEAVE"),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd),
        ),
      )
      .groupBy(attendance.userId);

    const onLeaveHeadCount = new Set([
      ...leaveUserIds.map((l) => l.userId),
      ...attendanceLeaveUserIds.map((a) => a.userId),
    ]).size;

    // Present in date range
    const [presentCount] = await db
      .select({ count: count() })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd),
          sql`${attendance.status} IN ('PRESENT', 'LATE')`,
          ...deptFilter,
        ),
      );

    // Absent in date range
    const [absentCount] = await db
      .select({ count: count() })
      .from(attendance)
      .leftJoin(users, eq(attendance.userId, users.id))
      .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd),
          eq(attendance.status, "ABSENT"),
          ...deptFilter,
        ),
      );

    // New hires in date range
    const [newHires] = await db
      .select({ count: count() })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          gte(users.createdAt, todayStart),
          lte(users.createdAt, todayEnd),
          ...deptFilter,
        ),
      );

    return {
      totalEmployees: totalEmp?.count || 0,
      activeEmployees: activeEmp?.count || 0,
      onLeave: onLeaveHeadCount,
      presentToday: presentCount?.count || 0,
      absentToday: absentCount?.count || 0,
      newHiresThisMonth: newHires?.count || 0,
    };
  }

  /**
   * Get chart data for HR Dashboard
   */
  async getChartData(
    workspaceId: string,
    department?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const now = new Date();
    const deptFilter =
      department && department !== "all" ? [eq(teams.name, department)] : [];

    // Get total members for percentage calculation
    const [totalMembers] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(and(eq(workspaceMembers.workspaceId, workspaceId), ...deptFilter));

    const total = totalMembers?.count || 1;

    // Department distribution
    const departmentDistribution = await db
      .select({
        department: teams.name,
        count: count(),
      })
      .from(workspaceMembers)
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(eq(workspaceMembers.workspaceId, workspaceId))
      .groupBy(teams.name);

    // Attendance trend (last 10 days from the date range)
    const attendanceTrend = [];
    const endDate = dateTo ? new Date(dateTo) : new Date();
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);

    // Calculate days between start and end
    const daysDiff = Math.min(
      9,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );

    for (let i = daysDiff; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const [presentData] = await db
        .select({ count: count() })
        .from(attendance)
        .leftJoin(users, eq(attendance.userId, users.id))
        .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
        .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
        .where(
          and(
            eq(attendance.workspaceId, workspaceId),
            gte(attendance.date, dayStart),
            lte(attendance.date, dayEnd),
            sql`${attendance.status} IN ('PRESENT', 'LATE')`,
            ...deptFilter,
          ),
        );

      const [absentData] = await db
        .select({ count: count() })
        .from(attendance)
        .leftJoin(users, eq(attendance.userId, users.id))
        .leftJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
        .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
        .where(
          and(
            eq(attendance.workspaceId, workspaceId),
            gte(attendance.date, dayStart),
            lte(attendance.date, dayEnd),
            eq(attendance.status, "ABSENT"),
            ...deptFilter,
          ),
        );

      const presentCount = presentData?.count || 0;

      attendanceTrend.push({
        date: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        present: presentCount,
        absent: absentData?.count || 0,
        total: total,
        percentage: total > 0 ? Math.round((presentCount / total) * 100) : 0,
      });
    }

    // Leave trend (last 6 months) - Head Count
    const leaveTrend = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - i,
        1,
      );
      const monthEnd = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - i + 1,
        0,
        23,
        59,
        59,
      );

      const leaveUserIds = await db
        .select({ userId: leaves.userId })
        .from(leaves)
        .where(
          and(
            eq(leaves.workspaceId, workspaceId),
            eq(leaves.status, "APPROVED"),
            lte(leaves.startDate, monthEnd),
            gte(leaves.endDate, monthStart),
          ),
        );

      const attendanceUserIds = await db
        .select({ userId: attendance.userId })
        .from(attendance)
        .where(
          and(
            eq(attendance.workspaceId, workspaceId),
            eq(attendance.status, "ON_LEAVE"),
            gte(attendance.date, monthStart),
            lte(attendance.date, monthEnd),
          ),
        );

      const uniqueUserIds = new Set([
        ...leaveUserIds.map((l) => l.userId),
        ...attendanceUserIds.map((a) => a.userId),
      ]);

      leaveTrend.push({
        month: monthStart.toLocaleDateString("en-GB", { month: "short" }),
        count: uniqueUserIds.size,
      });
    }

    return {
      departmentDistribution: departmentDistribution.map((d) => ({
        department: d.department || "No Team",
        count: d.count,
      })),
      attendanceTrend,
      leaveTrend,
    };
  }

  /**
   * Get employee lists by status
   */
  async getEmployeeLists(workspaceId: string, department?: string) {
    const today = new Date();
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const deptFilter =
      department && department !== "all" ? [eq(teams.name, department)] : [];

    // Get all workspace members
    const members = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        department: teams.name,
        role: roles.name,
      })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .leftJoin(roles, eq(workspaceMembers.roleId, roles.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
          ...deptFilter,
        ),
      );

    // Get today's attendance
    const todayAttendance = await db
      .select({ userId: attendance.userId, status: attendance.status })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd),
        ),
      );

    const attendanceMap = new Map(
      todayAttendance.map((a) => [a.userId, a.status]),
    );

    // Get today's on-leave users
    const todayLeaves = await db
      .select({ userId: leaves.userId })
      .from(leaves)
      .where(
        and(
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          lte(leaves.startDate, todayEnd),
          gte(leaves.endDate, todayStart),
        ),
      );

    const todayAttendanceLeave = await db
      .select({ userId: attendance.userId })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          eq(attendance.status, "ON_LEAVE"),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd),
        ),
      );

    const leaveSet = new Set([
      ...todayLeaves.map((l) => l.userId),
      ...todayAttendanceLeave.map((a) => a.userId),
    ]);

    // Categorize employees
    const present: any[] = [];
    const absent: any[] = [];
    const onLeave: any[] = [];
    const halfDay: any[] = [];

    members.forEach((member) => {
      const attStatus = attendanceMap.get(member.id);
      const isOnLeave = leaveSet.has(member.id);

      const employee = {
        id: member.id,
        name: member.name || "Unknown",
        email: member.email || "",
        department: member.department || "N/A",
        role: member.role || "N/A",
        avatar: member.avatar,
        initials:
          member.name
            ?.split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2) || "?",
        status: isOnLeave
          ? "onleave"
          : attStatus === "PRESENT" || attStatus === "LATE"
            ? "present"
            : attStatus === "HALF_DAY"
              ? "halfDay"
              : attStatus === "ABSENT"
                ? "absent"
                : "present",
      };

      if (isOnLeave) onLeave.push(employee);
      else if (attStatus === "HALF_DAY") halfDay.push(employee);
      else if (attStatus === "ABSENT") absent.push(employee);
      else present.push(employee);
    });

    return { present, absent, onLeave, halfDay };
  }
}
