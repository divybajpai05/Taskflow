// src/modules/hr-dashboard/hr-dashboard.service.ts
import { db } from "../../db/drizzle";
import {
  users,
  workspaceMembers,
  attendance,
  leaves,
  teams,
  roles,
  leaveTypes,
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

    const todayStart = dateFrom
      ? new Date(dateFrom + "T00:00:00.000")
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = dateTo
      ? new Date(dateTo + "T23:59:59.999")
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );

    const deptFilter =
      department && department !== "all" ? [eq(teams.name, department)] : [];

    // Total employees
    const [totalEmp] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .leftJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
          ...deptFilter,
        ),
      );

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

    // On Leave - Get unique users on leave for the selected date
    const leaveUserIds = await db
      .selectDistinct({ userId: leaves.userId })
      .from(leaves)
      .where(
        and(
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          lte(leaves.startDate, todayEnd),
          gte(leaves.endDate, todayStart),
        ),
      );

    const attendanceLeaveUserIds = await db
      .selectDistinct({ userId: attendance.userId })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          eq(attendance.status, "ON_LEAVE"),
          gte(attendance.date, todayStart),
          lte(attendance.date, todayEnd),
        ),
      );

    const onLeaveUserIds = new Set([
      ...leaveUserIds.map((l) => l.userId),
      ...attendanceLeaveUserIds.map((a) => a.userId),
    ]);

    // Present Today
    const presentUserIds = await db
      .selectDistinct({ userId: attendance.userId })
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

    const presentCount = presentUserIds.filter(
      (p) => !onLeaveUserIds.has(p.userId),
    ).length;

    // Absent Today
    const absentUserIds = await db
      .selectDistinct({ userId: attendance.userId })
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

    const absentCount = absentUserIds.length;

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

    console.log("HR KPI Data:", {
      totalEmployees: totalEmp?.count || 0,
      activeEmployees: activeEmp?.count || 0,
      onLeave: onLeaveUserIds.size,
      presentToday: presentCount,
      absentToday: absentCount,
    });

    return {
      totalEmployees: totalEmp?.count || 0,
      activeEmployees: activeEmp?.count || 0,
      onLeave: onLeaveUserIds.size,
      presentToday: presentCount,
      absentToday: absentCount,
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

    // FIXED: Fetch dynamic leave types from database
    const workspaceLeaveTypes = await db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.isActive, true),
        ),
      );

    console.log(
      "Workspace Leave Types:",
      JSON.stringify(workspaceLeaveTypes, null, 2),
    );

    // Build color map and name map from workspace leave types
    const leaveTypeColorMap: Record<string, string> = {};
    const leaveTypeIdToNameMap: Record<string, string> = {};

    workspaceLeaveTypes.forEach((lt) => {
      leaveTypeColorMap[lt.name] = lt.color;
      leaveTypeIdToNameMap[lt.id] = lt.name;
      // Also store by ID for fallback
      leaveTypeColorMap[lt.id] = lt.color;
    });

    // Default colors for fallback
    const defaultColors = [
      "#3b82f6",
      "#ef4444",
      "#f59e0b",
      "#10b981",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#f97316",
    ];

    // Get total active members
    const [totalMembers] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .leftJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
          ...deptFilter,
        ),
      );

    const total = totalMembers?.count || 1;

    // Today's date range
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const todayEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59,
      999,
    );

    // Department distribution
    const departmentDistribution = await db
      .select({
        department: teams.name,
        count: count(),
      })
      .from(workspaceMembers)
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .leftJoin(users, eq(workspaceMembers.userId, users.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
        ),
      )
      .groupBy(teams.name);

    // Attendance trend
    const endDate = dateTo ? new Date(dateTo + "T23:59:59.999") : new Date();
    const startDate = dateFrom
      ? new Date(dateFrom + "T00:00:00.000")
      : new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const daysDiff = Math.min(
      30,
      Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000),
      ),
    );

    const attendanceTrend = [];
    for (let i = daysDiff; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0,
      );
      const dayEnd = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        23,
        59,
        59,
        999,
      );

      const presentUsers = await db
        .selectDistinct({ userId: attendance.userId })
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

      const absentUsers = await db
        .selectDistinct({ userId: attendance.userId })
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

      const presentCount = presentUsers.length;
      const percentage =
        total > 0 ? Math.round((presentCount / total) * 100) : 0;

      attendanceTrend.push({
        date: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        present: presentCount,
        absent: absentUsers.length,
        total: total,
        percentage: percentage,
      });
    }

    // ============ DYNAMIC LEAVE DISTRIBUTION ============

    // FIXED: Today's leave types with proper JOIN to leaveTypes table
    const todayLeavesData = await db
      .select({
        leaveTypeId: leaves.leaveTypeId,
        leaveTypeName: leaveTypes.name,
        leaveTypeColor: leaveTypes.color,
        userId: leaves.userId,
      })
      .from(leaves)
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id))
      .where(
        and(
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          lte(leaves.startDate, todayEnd),
          gte(leaves.endDate, todayStart),
        ),
      );

    console.log(
      "Today's Leave Data:",
      JSON.stringify(todayLeavesData, null, 2),
    );

    // Group today's leaves by leave type name
    const todayLeaveTypeMap = new Map<
      string,
      { userIds: Set<string>; color: string }
    >();
    let fallbackColorIndex = 0;

    todayLeavesData.forEach((leave) => {
      // Use the actual name from the join, or fallback to ID mapping, then to "Other"
      let typeName =
        leave.leaveTypeName ||
        leaveTypeIdToNameMap[leave.leaveTypeId || ""] ||
        "Other";

      let color =
        leave.leaveTypeColor ||
        leaveTypeColorMap[typeName] ||
        defaultColors[fallbackColorIndex % defaultColors.length];

      if (!leave.leaveTypeColor && !leaveTypeColorMap[typeName]) {
        fallbackColorIndex++;
      }

      if (!todayLeaveTypeMap.has(typeName)) {
        todayLeaveTypeMap.set(typeName, {
          userIds: new Set(),
          color: color,
        });
      }
      todayLeaveTypeMap.get(typeName)!.userIds.add(leave.userId);
    });

    // Build today's leave types array
    const todayLeaveTypes: { type: string; count: number; color: string }[] =
      [];
    todayLeaveTypeMap.forEach((data, typeName) => {
      todayLeaveTypes.push({
        type: typeName,
        count: data.userIds.size,
        color: data.color,
      });
    });

    const todayLeaveCount = new Set(todayLeavesData.map((l) => l.userId)).size;

    console.log("Today Leave Types:", JSON.stringify(todayLeaveTypes, null, 2));
    console.log("Today Leave Count:", todayLeaveCount);

    // FIXED: Monthly leave trend with proper JOIN
    const monthlyLeaveTrend: any[] = [];

    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
        0,
        0,
        0,
        0,
      );
      const monthEnd = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59,
        999,
      );

      const monthLeaves = await db
        .select({
          leaveTypeId: leaves.leaveTypeId,
          leaveTypeName: leaveTypes.name,
          leaveTypeColor: leaveTypes.color,
          userId: leaves.userId,
        })
        .from(leaves)
        .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id))
        .where(
          and(
            eq(leaves.workspaceId, workspaceId),
            eq(leaves.status, "APPROVED"),
            lte(leaves.startDate, monthEnd),
            gte(leaves.endDate, monthStart),
          ),
        );

      // Count unique employees per leave type
      const typeUserMap = new Map<string, Set<string>>();

      monthLeaves.forEach((leave) => {
        const typeName =
          leave.leaveTypeName ||
          leaveTypeIdToNameMap[leave.leaveTypeId || ""] ||
          "Other";

        if (!typeUserMap.has(typeName)) {
          typeUserMap.set(typeName, new Set());
        }
        typeUserMap.get(typeName)!.add(leave.userId);
      });

      // Build month entry with dynamic leave type counts
      const monthEntry: any = {
        month: monthStart.toLocaleDateString("en-GB", { month: "short" }),
      };

      let totalForMonth = 0;

      // Initialize all active leave types with 0
      workspaceLeaveTypes.forEach((lt) => {
        const userSet = typeUserMap.get(lt.name) || new Set();
        monthEntry[lt.name] = userSet.size;
        totalForMonth += userSet.size;
      });

      // Add any unknown leave types found in data
      typeUserMap.forEach((userIds, typeName) => {
        if (!monthEntry.hasOwnProperty(typeName)) {
          monthEntry[typeName] = userIds.size;
          totalForMonth += userIds.size;
        }
      });

      monthEntry.total = totalForMonth;
      monthlyLeaveTrend.push(monthEntry);
    }

    console.log(
      "Monthly Leave Trend:",
      JSON.stringify(monthlyLeaveTrend, null, 2),
    );

    // Get all unique leave type names
    const allLeaveTypeNames = workspaceLeaveTypes.map((lt) => lt.name);

    // Also include any types found in data but not in workspace config
    monthlyLeaveTrend.forEach((month) => {
      Object.keys(month).forEach((key) => {
        if (
          key !== "month" &&
          key !== "total" &&
          !allLeaveTypeNames.includes(key)
        ) {
          allLeaveTypeNames.push(key);
          // Assign a color if not already mapped
          if (!leaveTypeColorMap[key]) {
            leaveTypeColorMap[key] =
              defaultColors[allLeaveTypeNames.length % defaultColors.length];
          }
        }
      });
    });

    console.log("All Leave Type Names:", allLeaveTypeNames);
    console.log("Leave Type Colors:", leaveTypeColorMap);

    return {
      departmentDistribution: departmentDistribution.map((d) => ({
        department: d.department || "No Team",
        count: d.count,
      })),
      attendanceTrend,
      leaveByType: todayLeaveTypes,
      monthlyLeaveTrend,
      todayLeaveCount,
      todayLeaveTypes,
      leaveTypeNames: allLeaveTypeNames,
      leaveTypeColors: leaveTypeColorMap,
    };
  }

  /**
   * Get employee lists by status
   */
  async getEmployeeLists(
    workspaceId: string,
    department?: string,
    memberId?: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const now = new Date();
    const todayStart = dateFrom
      ? new Date(dateFrom + "T00:00:00.000")
      : new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = dateTo
      ? new Date(dateTo + "T23:59:59.999")
      : new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59,
          999,
        );

    const deptFilter =
      department && department !== "all" ? [eq(teams.name, department)] : [];
    const memberFilter =
      memberId && memberId !== "all" ? [eq(users.id, memberId)] : [];

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
          ...memberFilter,
        ),
      );

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

    const attendanceMap = new Map<string, string>();
    todayAttendance.forEach((a) => {
      if (!attendanceMap.has(a.userId)) {
        attendanceMap.set(a.userId, a.status);
      }
    });

    const todayLeaves = await db
      .selectDistinct({ userId: leaves.userId })
      .from(leaves)
      .where(
        and(
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          lte(leaves.startDate, todayEnd),
          gte(leaves.endDate, todayStart),
        ),
      );

    const leaveSet = new Set(todayLeaves.map((l) => l.userId));

    const present: any[] = [];
    const absent: any[] = [];
    const onLeave: any[] = [];
    const halfDay: any[] = [];
    const notMarked: any[] = [];

    members.forEach((member) => {
      const attStatus = attendanceMap.get(member.id);
      const isOnLeave = leaveSet.has(member.id);

      let status: string;
      if (isOnLeave) {
        status = "onleave";
      } else if (attStatus === "PRESENT" || attStatus === "LATE") {
        status = "present";
      } else if (attStatus === "HALF_DAY") {
        status = "halfDay";
      } else if (attStatus === "ABSENT") {
        status = "absent";
      } else if (attStatus === "ON_LEAVE") {
        status = "onleave";
      } else {
        status = "notMarked";
      }

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
        status,
      };

      if (status === "onleave") onLeave.push(employee);
      else if (status === "halfDay") halfDay.push(employee);
      else if (status === "absent") absent.push(employee);
      else if (status === "present") present.push(employee);
      else notMarked.push(employee);
    });

    return { present, absent, onLeave, halfDay, notMarked };
  }
}
