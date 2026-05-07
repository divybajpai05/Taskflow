// src/modules/attendance/attendance.service.ts
import { db } from "../../db/drizzle";
import {
  attendance,
  users,
  workspaceMembers,
  roles,
  teams,
} from "../../db/schema";
import { eq, and, gte, lte, count, inArray } from "drizzle-orm";

export class AttendanceService {
  /**
   * Get attendance for a specific date
   */
  async getAttendanceByDate(workspaceId: string, date: string) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // FIXED: Get team from teams table via workspaceMembers
    const workspaceUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        avatar: users.avatar,
        team: teams.name, // FIXED: Get team name from teams table
        role: roles.name,
      })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id)) // FIXED: Join with teams
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
        ),
      );

    // Get attendance records for this date
    const attendanceRecords = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, startOfDay),
          lte(attendance.date, endOfDay),
        ),
      );

    // Merge users with their attendance
    const attendanceSheet = workspaceUsers.map((user) => {
      const record = attendanceRecords.find((a) => a.userId === user.id);
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        initials: user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
        team: user.team || "N/A",
        department: user.team || "N/A",
        role: user.role,
        status: record?.status || null,
        checkInTime: record?.date
          ? new Date(record.date).toLocaleTimeString()
          : "-",
        notes: record?.notes || null,
        attendanceId: record?.id || null,
      };
    });

    return attendanceSheet;
  }

  /**
   * Mark or update attendance for a user
   */
  async markAttendance(
    workspaceId: string,
    userId: string,
    date: string,
    status: string,
    markedById: string,
    notes?: string,
  ) {
    const targetDate = new Date(date);
    targetDate.setHours(9, 0, 0, 0);

    const [existingRecord] = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, new Date(date + "T00:00:00")),
          lte(attendance.date, new Date(date + "T23:59:59")),
        ),
      )
      .limit(1);

    if (existingRecord) {
      await db
        .update(attendance)
        .set({
          status: status as any,
          markedById,
          notes: notes || null,
        })
        .where(eq(attendance.id, existingRecord.id));

      return { ...existingRecord, status, markedById, notes };
    } else {
      const newRecord = {
        userId,
        workspaceId,
        date: targetDate,
        status: status as any,
        markedById,
        notes: notes || null,
      };

      await db.insert(attendance).values({
        id: crypto.randomUUID(),
        ...newRecord,
      });

      return newRecord;
    }
  }

  /**
   * Bulk mark attendance for multiple users
   */
  async bulkMarkAttendance(
    workspaceId: string,
    date: string,
    status: string,
    userIds: string[],
    markedById: string,
  ) {
    const results = [];
    for (const userId of userIds) {
      const result = await this.markAttendance(
        workspaceId,
        userId,
        date,
        status,
        markedById,
      );
      results.push(result);
    }
    return { success: true, count: results.length };
  }

  /**
   * Get attendance stats for a date
   */
  async getAttendanceStats(workspaceId: string, date: string) {
    const attendanceSheet = await this.getAttendanceByDate(workspaceId, date);
    const total = attendanceSheet.length;

    const present = attendanceSheet.filter(
      (a) => a.status === "PRESENT",
    ).length;
    const absent = attendanceSheet.filter((a) => a.status === "ABSENT").length;
    const late = attendanceSheet.filter((a) => a.status === "LATE").length;
    const halfDay = attendanceSheet.filter(
      (a) => a.status === "HALF_DAY",
    ).length;
    const onLeave = attendanceSheet.filter(
      (a) => a.status === "ON_LEAVE",
    ).length;
    const notMarked = attendanceSheet.filter((a) => !a.status).length;

    return {
      total,
      present,
      absent,
      late,
      halfDay,
      onLeave,
      notMarked,
      presentPercentage: total > 0 ? Math.round((present / total) * 100) : 0,
      absentPercentage: total > 0 ? Math.round((absent / total) * 100) : 0,
    };
  }

  /**
   * Get monthly attendance stats
   */
  async getMonthlyStats(workspaceId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
        ),
      );

    const totalDays =
      records.length > 0
        ? new Set(records.map((r) => new Date(r.date).toDateString())).size
        : 0;

    const presentCount = records.filter((r) => r.status === "PRESENT").length;
    const totalRecords = records.length;

    return {
      totalWorkingDays: totalDays,
      totalAttendanceRecords: totalRecords,
      averageAttendance:
        totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0,
    };
  }

  /**
   * Get attendance for calendar view - for any month
   */
  async getCalendarMonthly(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId: string | null,
    month: number,
    year: number,
  ) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const conditions: any[] = [
      eq(attendance.workspaceId, workspaceId),
      gte(attendance.date, startDate),
      lte(attendance.date, endDate),
      eq(attendance.userId, userId),
    ];

    const records = await db
      .select({ date: attendance.date, status: attendance.status })
      .from(attendance)
      .where(and(...conditions));

    return records;
  }
}
