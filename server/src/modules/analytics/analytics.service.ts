// src/modules/analytics/analytics.service.ts
import { db } from "../../db/drizzle";
import {
  tasks,
  users,
  workspaceMembers,
  teams,
  taskAssignees,
  attendance,
  leaves,
  leaveTypes,
} from "../../db/schema";
import { eq, and, gte, lte, count, sql, desc, inArray, ne } from "drizzle-orm";

export class AnalyticsService {
  /**
   * Get KPI metrics for Analytics Dashboard
   */
  async getKPIData(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
    memberId?: string,
    teamId?: string,
    status?: string,
    priority?: string,
  ) {
    const now = new Date();
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = dateTo ? new Date(dateTo + "T23:59:59") : now;

    // Calculate previous period (same length as current period)
    const periodLength = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - periodLength);

    // Build filters
    const filters = await this.buildFilters(
      workspaceId,
      memberId,
      teamId,
      status,
      priority,
    );

    const currentPeriodFilters = [
      ...filters,
      gte(tasks.createdAt, startDate),
      lte(tasks.createdAt, endDate),
    ];

    const prevPeriodFilters = [
      ...filters,
      gte(tasks.createdAt, prevStartDate),
      lte(tasks.createdAt, prevEndDate),
    ];

    // ===== CURRENT PERIOD METRICS =====

    // Total Tasks
    const [totalTasksResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...currentPeriodFilters));
    const totalTasks = totalTasksResult?.count || 0;

    // Completed Tasks
    const [completedResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...currentPeriodFilters, eq(tasks.status, "DONE")));
    const completedTasks = completedResult?.count || 0;

    // Overdue Tasks
    const [overdueResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          ...currentPeriodFilters,
          sql`${tasks.status} NOT IN ('DONE', 'CANCELLED')`,
          sql`${tasks.dueDate} IS NOT NULL`,
          sql`${tasks.dueDate} < NOW()`,
        ),
      );
    const overdueTasks = overdueResult?.count || 0;

    // In Progress Tasks
    const [inProgressResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...currentPeriodFilters, eq(tasks.status, "IN_PROGRESS")));
    const inProgressTasks = inProgressResult?.count || 0;

    // ===== ON-TIME COMPLETION RATE =====
    let onTimeRate = 0;

    if (totalTasks > 0) {
      const [onTimeCompletedResult] = await db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            ...currentPeriodFilters,
            eq(tasks.status, "DONE"),
            sql`(
              ${tasks.dueDate} IS NULL 
              OR ${tasks.dueDate} >= ${tasks.updatedAt}
            )`,
          ),
        );

      const onTimeCompleted = onTimeCompletedResult?.count || 0;
      onTimeRate = Math.round((onTimeCompleted / totalTasks) * 100);
    }

    // ===== AVERAGE COMPLETION TIME =====
    let avgCompletionDays = 0;

    if (completedTasks > 0) {
      const completedTasksData = await db
        .select({
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(and(...currentPeriodFilters, eq(tasks.status, "DONE")));

      if (completedTasksData.length > 0) {
        const totalDays = completedTasksData.reduce((sum, task) => {
          const created = new Date(task.createdAt || new Date());
          const updated = new Date(task.updatedAt || new Date());
          const diffDays =
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + Math.max(0, diffDays);
        }, 0);
        avgCompletionDays =
          Math.round((totalDays / completedTasksData.length) * 10) / 10;
      }
    }

    // ===== PREVIOUS PERIOD METRICS =====

    const [prevTotalResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...prevPeriodFilters));
    const prevTotalTasks = prevTotalResult?.count || 0;

    const [prevCompletedResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(...prevPeriodFilters, eq(tasks.status, "DONE")));
    const prevCompletedTasks = prevCompletedResult?.count || 0;

    const [prevOverdueResult] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(
          ...prevPeriodFilters,
          sql`${tasks.status} NOT IN ('DONE', 'CANCELLED')`,
          sql`${tasks.dueDate} IS NOT NULL`,
          sql`${tasks.dueDate} < ${prevEndDate}`,
        ),
      );
    const prevOverdueTasks = prevOverdueResult?.count || 0;

    let prevOnTimeRate = 0;
    if (prevTotalTasks > 0) {
      const [prevOnTimeResult] = await db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            ...prevPeriodFilters,
            eq(tasks.status, "DONE"),
            sql`(
              ${tasks.dueDate} IS NULL 
              OR ${tasks.dueDate} >= ${tasks.updatedAt}
            )`,
          ),
        );
      const prevOnTimeCompleted = prevOnTimeResult?.count || 0;
      prevOnTimeRate = Math.round((prevOnTimeCompleted / prevTotalTasks) * 100);
    }

    let prevAvgCompletionDays = 0;
    if (prevCompletedTasks > 0) {
      const prevCompletedTasksData = await db
        .select({
          createdAt: tasks.createdAt,
          updatedAt: tasks.updatedAt,
        })
        .from(tasks)
        .where(and(...prevPeriodFilters, eq(tasks.status, "DONE")));

      if (prevCompletedTasksData.length > 0) {
        const totalDays = prevCompletedTasksData.reduce((sum, task) => {
          const created = new Date(task.createdAt || new Date());
          const updated = new Date(task.updatedAt || new Date());
          const diffDays =
            (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
          return sum + Math.max(0, diffDays);
        }, 0);
        prevAvgCompletionDays =
          Math.round((totalDays / prevCompletedTasksData.length) * 10) / 10;
      }
    }

    // ===== CALCULATE PERCENTAGE CHANGES =====

    let tasksCreatedChange = 0;
    if (prevTotalTasks > 0) {
      tasksCreatedChange = Math.round(
        ((totalTasks - prevTotalTasks) / prevTotalTasks) * 100,
      );
    } else if (totalTasks > 0) {
      tasksCreatedChange = 100;
    }

    let tasksCompletedChange = 0;
    if (prevCompletedTasks > 0) {
      tasksCompletedChange = Math.round(
        ((completedTasks - prevCompletedTasks) / prevCompletedTasks) * 100,
      );
    } else if (completedTasks > 0) {
      tasksCompletedChange = 100;
    }

    let overdueChange = 0;
    if (prevOverdueTasks > 0) {
      overdueChange = Math.round(
        ((overdueTasks - prevOverdueTasks) / prevOverdueTasks) * 100,
      );
    } else if (overdueTasks > 0) {
      overdueChange = 100;
    }

    // ===== VALIDATION =====

    if (totalTasks === 0) {
      return {
        totalTasks: 0,
        completed: 0,
        overdue: 0,
        inProgress: 0,
        onTimeCompletion: 0,
        avgCompletionTime: 0,
        previousTotalTasks: prevTotalTasks,
        previousCompleted: prevCompletedTasks,
        previousOverdue: prevOverdueTasks,
        previousOnTime: prevOnTimeRate,
        previousAvgTime: prevAvgCompletionDays,
        tasksCreatedChange,
        tasksCompletedChange,
        overdueChange,
      };
    }

    const validatedCompleted = Math.min(completedTasks, totalTasks);
    const maxOverdue = totalTasks - validatedCompleted;
    const validatedOverdue = Math.min(overdueTasks, maxOverdue);
    const validatedInProgress = Math.min(inProgressTasks, maxOverdue);

    return {
      totalTasks,
      completed: validatedCompleted,
      overdue: validatedOverdue,
      inProgress: validatedInProgress,
      onTimeCompletion: onTimeRate,
      avgCompletionTime: avgCompletionDays,
      previousTotalTasks: prevTotalTasks,
      previousCompleted: prevCompletedTasks,
      previousOverdue: prevOverdueTasks,
      previousOnTime: prevOnTimeRate,
      previousAvgTime: prevAvgCompletionDays,
      tasksCreatedChange,
      tasksCompletedChange,
      overdueChange,
    };
  }

  /**
   * Get chart data for Analytics
   */
  async getChartData(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
    memberId?: string,
    teamId?: string,
    status?: string,
    priority?: string,
  ) {
    const now = new Date();
    const endDate = dateTo ? new Date(dateTo) : now;
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    const filters = await this.buildFilters(
      workspaceId,
      memberId,
      teamId,
      status,
      priority,
    );

    // Task Completion Trend (last 10 days)
    const trendData = [];
    for (let i = 9; i >= 0; i--) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      const dayStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const [createdCount] = await db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            ...filters,
            gte(tasks.createdAt, dayStart),
            lte(tasks.createdAt, dayEnd),
          ),
        );

      const [completedCount] = await db
        .select({ count: count() })
        .from(tasks)
        .where(
          and(
            ...filters,
            eq(tasks.status, "DONE"),
            gte(tasks.updatedAt, dayStart),
            lte(tasks.updatedAt, dayEnd),
          ),
        );

      trendData.push({
        name: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
        }),
        created: createdCount?.count || 0,
        completed: completedCount?.count || 0,
      });
    }

    // Status Distribution
    const statusDistribution = await db
      .select({ status: tasks.status, count: count() })
      .from(tasks)
      .where(and(...filters))
      .groupBy(tasks.status);

    const statusMap: Record<string, string> = {
      TODO: "Todo",
      IN_PROGRESS: "In progress",
      DONE: "Done",
      REVIEW: "On Hold",
      CANCELLED: "Cancelled",
      ON_HOLD: "On Hold",
    };

    // Priority Breakdown
    const priorityBreakdown = await db
      .select({ priority: tasks.priority, count: count() })
      .from(tasks)
      .where(and(...filters))
      .groupBy(tasks.priority);

    const priorityMap: Record<string, string> = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
    };

    return {
      trendData,
      statusDistribution: statusDistribution.map((s) => ({
        name: statusMap[s.status || ""] || s.status,
        value: s.count,
      })),
      priorityBreakdown: priorityBreakdown.map((p) => ({
        name: priorityMap[p.priority || ""] || p.priority,
        tasks: p.count,
      })),
    };
  }

  /**
   * Get team performance data
   */
  async getTeamPerformance(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
    memberId?: string,
    teamId?: string,
  ) {
    const now = new Date();
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = dateTo ? new Date(dateTo + "T23:59:59") : now;

    const memberFilters: any[] = [
      eq(workspaceMembers.workspaceId, workspaceId),
      eq(users.isActive, true),
    ];
    if (teamId && teamId !== "all")
      memberFilters.push(eq(workspaceMembers.teamId, teamId));
    if (memberId && memberId !== "all")
      memberFilters.push(eq(users.id, memberId));

    const members = await db
      .select({ id: users.id, name: users.name, team: teams.name })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(and(...memberFilters));

    const performance = await Promise.all(
      members.map(async (member) => {
        const taskFilters = [
          eq(tasks.workspaceId, workspaceId),
          gte(tasks.createdAt, startDate),
          lte(tasks.createdAt, endDate),
        ];

        const assignedTasks = await db
          .select({
            id: tasks.id,
            status: tasks.status,
            dueDate: tasks.dueDate,
            createdAt: tasks.createdAt,
            updatedAt: tasks.updatedAt,
          })
          .from(tasks)
          .innerJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId))
          .where(and(...taskFilters, eq(taskAssignees.userId, member.id)));

        const totalAssigned = assignedTasks.length;
        const completed = assignedTasks.filter(
          (t) => t.status === "DONE",
        ).length;
        const completionRate =
          totalAssigned > 0 ? Math.round((completed / totalAssigned) * 100) : 0;

        const onTimeTasks = assignedTasks.filter((t) => {
          if (t.status !== "DONE" || !t.dueDate) return false;
          return new Date(t.updatedAt || "") <= new Date(t.dueDate);
        });
        const onTimeRate =
          completed > 0
            ? Math.round((onTimeTasks.length / completed) * 100)
            : 0;

        const overdueCount = assignedTasks.filter((t) => {
          if (!t.dueDate || t.status === "DONE" || t.status === "CANCELLED")
            return false;
          return new Date(t.dueDate) < new Date();
        }).length;

        const completedTasks = assignedTasks.filter((t) => t.status === "DONE");
        let avgTime = 0;
        if (completedTasks.length > 0) {
          const totalDays = completedTasks.reduce((sum, t) => {
            return (
              sum +
              (new Date(t.updatedAt || "").getTime() -
                new Date(t.createdAt || "").getTime()) /
                (1000 * 60 * 60 * 24)
            );
          }, 0);
          avgTime = Math.round((totalDays / completedTasks.length) * 10) / 10;
        }

        const activeTasks = assignedTasks.filter(
          (t) => t.status !== "DONE" && t.status !== "CANCELLED",
        ).length;
        const workload =
          totalAssigned > 0
            ? Math.round((activeTasks / Math.max(totalAssigned, 10)) * 100)
            : 0;

        return {
          id: member.id,
          name: member.name || "Unknown",
          initials:
            member.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2) || "?",
          team: member.team || "N/A",
          tasksAssigned: totalAssigned,
          tasksCompleted: completed,
          completionRate,
          onTimeRate,
          overdueCount,
          avgCompletionTime: avgTime,
          workload,
        };
      }),
    );

    performance.sort((a, b) => b.completionRate - a.completionRate);
    return performance;
  }

  /**
   * Get task details list
   */
  async getTaskDetails(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
    memberId?: string,
    teamId?: string,
    status?: string,
    priority?: string,
  ) {
    const now = new Date();
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = dateTo ? new Date(dateTo + "T23:59:59") : now;

    const filters = await this.buildFilters(
      workspaceId,
      memberId,
      teamId,
      status,
      priority,
    );
    const dateFilters = [
      gte(tasks.createdAt, startDate),
      lte(tasks.createdAt, endDate),
    ];

    const taskList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
        teamName: teams.name,
        assigneeNames:
          sql`GROUP_CONCAT(DISTINCT ${users.name} SEPARATOR '|||')`.as(
            "assigneeNames",
          ),
      })
      .from(tasks)
      .leftJoin(taskAssignees, eq(tasks.id, taskAssignees.taskId))
      .leftJoin(users, eq(taskAssignees.userId, users.id))
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .where(and(...filters, ...dateFilters))
      .groupBy(tasks.id)
      .orderBy(desc(tasks.createdAt))
      .limit(100);

    const statusMap: Record<string, string> = {
      TODO: "Todo",
      IN_PROGRESS: "In progress",
      DONE: "Done",
      REVIEW: "On Hold",
      CANCELLED: "Cancelled",
      ON_HOLD: "On Hold",
    };
    const priorityMap: Record<string, string> = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
    };

    return taskList.map((task) => {
      const isCompleted = task.status === "DONE";
      const isOverdue =
        !isCompleted && task.dueDate && new Date(task.dueDate) < new Date();
      const daysOverdue = isOverdue
        ? Math.ceil(
            (new Date().getTime() - new Date(task.dueDate!).getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : 0;
      const timeTaken = isCompleted
        ? Math.ceil(
            (new Date(task.updatedAt || "").getTime() -
              new Date(task.createdAt || "").getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : Math.ceil(
            (new Date().getTime() - new Date(task.createdAt || "").getTime()) /
              (1000 * 60 * 60 * 24),
          );

      const assigneeNamesArray = task.assigneeNames
        ? (task.assigneeNames as string).split("|||").filter(Boolean)
        : [];

      const assigneeInitialsArray = assigneeNamesArray.map((name) =>
        name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      );

      return {
        id: task.id,
        title: task.title,
        assignee: assigneeNamesArray[0] || "Unassigned",
        assignees: assigneeNamesArray,
        team: task.teamName || "N/A",
        assigneeInitials: assigneeInitialsArray[0] || "?",
        assigneeInitialsList: assigneeInitialsArray,
        status: statusMap[task.status || ""] || task.status,
        priority: priorityMap[task.priority || ""] || task.priority,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("en-GB")
          : "—",
        completedDate: isCompleted
          ? new Date(task.updatedAt || "").toLocaleDateString("en-GB")
          : undefined,
        daysOverdue: isOverdue ? daysOverdue : 0,
        timeTaken,
      };
    });
  }

  //  Get leave trends by team - using dynamic leave types
  async getLeaveTrends(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    const now = new Date();
    const endDate = dateTo ? new Date(dateTo) : now;
    const startDate = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    // Get active leave types
    const activeLeaveTypes = await db
      .select()
      .from(leaveTypes)
      .where(
        and(
          eq(leaveTypes.workspaceId, workspaceId),
          eq(leaveTypes.isActive, true),
        ),
      );

    const leaveTypeKeyMap: Record<
      string,
      { key: string; color: string; label: string }
    > = {};
    const defaultColors = [
      "#3b82f6",
      "#ef4444",
      "#22c55e",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
    ];

    activeLeaveTypes.forEach((lt, index) => {
      const key = lt.name.toLowerCase().replace(/\s+/g, "_");
      leaveTypeKeyMap[lt.id] = {
        key,
        color: lt.color || defaultColors[index % defaultColors.length],
        label: lt.name,
      };
    });

    // ===== TEAM WISE =====
    const leaveRecords = await db
      .select({
        teamName: teams.name,
        leaveTypeId: leaves.leaveTypeId,
        leaveTypeName: leaveTypes.name,
        count: count(),
      })
      .from(leaves)
      .innerJoin(users, eq(leaves.userId, users.id))
      .innerJoin(
        workspaceMembers,
        and(
          eq(users.id, workspaceMembers.userId),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id))
      .where(
        and(eq(leaves.workspaceId, workspaceId), eq(leaves.status, "APPROVED")),
      )
      .groupBy(teams.name, leaves.leaveTypeId, leaveTypes.name);

    const teamMap = new Map<string, any>();
    leaveRecords.forEach((r) => {
      const teamName = r.teamName || "No Team";
      const ltInfo = leaveTypeKeyMap[r.leaveTypeId] || {
        key: (r.leaveTypeName || "other").toLowerCase().replace(/\s+/g, "_"),
        color: "#94a3b8",
        label: r.leaveTypeName || "Other",
      };
      if (!teamMap.has(teamName))
        teamMap.set(teamName, { team: teamName, total: 0 });
      const entry = teamMap.get(teamName)!;
      if (!entry.hasOwnProperty(ltInfo.key)) entry[ltInfo.key] = 0;
      entry[ltInfo.key] += r.count;
      entry.total += r.count;
    });

    const teamData = Array.from(teamMap.values()).sort(
      (a, b) => b.total - a.total,
    );

    // ===== MONTHLY WISE (last 6 months) =====
    const monthlyData: any[] = [];
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

      const typeUserMap = new Map<string, Set<string>>();
      monthLeaves.forEach((leave) => {
        const ltInfo = leaveTypeKeyMap[leave.leaveTypeId] || {
          key: (leave.leaveTypeName || "other")
            .toLowerCase()
            .replace(/\s+/g, "_"),
          label: leave.leaveTypeName || "Other",
        };
        if (!typeUserMap.has(ltInfo.key))
          typeUserMap.set(ltInfo.key, new Set());
        typeUserMap.get(ltInfo.key)!.add(leave.userId);
      });

      const monthEntry: any = {
        month: monthStart.toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        }),
      };
      let totalForMonth = 0;
      activeLeaveTypes.forEach((lt) => {
        const key =
          leaveTypeKeyMap[lt.id]?.key ||
          lt.name.toLowerCase().replace(/\s+/g, "_");
        const count = (typeUserMap.get(key) || new Set()).size;
        monthEntry[key] = count;
        totalForMonth += count;
      });
      monthEntry.total = totalForMonth;
      monthlyData.push(monthEntry);
    }

    // Build labels and colors
    const leaveTypeLabels: Record<string, string> = {};
    const leaveTypeColors: Record<string, string> = {};
    const leaveTypeKeysList: string[] = [];
    Object.values(leaveTypeKeyMap).forEach((v) => {
      leaveTypeLabels[v.key] = v.label;
      leaveTypeColors[v.key] = v.color;
      leaveTypeKeysList.push(v.key);
    });

    return {
      data: teamData,
      monthlyData,
      leaveTypeKeys: leaveTypeKeysList,
      leaveTypeLabels,
      leaveTypeColors,
    };
  }

  /**
   * Get team workload graph data
   */
  async getTeamWorkload(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // ... (unchanged)
    const teamList = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.workspaceId, workspaceId));
    const workload = await Promise.all(
      teamList.map(async (team) => {
        const [totalTasks] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(eq(tasks.workspaceId, workspaceId), eq(tasks.teamId, team.id)),
          );
        const [completedTasks] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.teamId, team.id),
              eq(tasks.status, "DONE"),
            ),
          );
        const [activeTasks] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.teamId, team.id),
              ne(tasks.status, "DONE"),
              ne(tasks.status, "CANCELLED"),
            ),
          );
        const [overdueTasks] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.teamId, team.id),
              ne(tasks.status, "DONE"),
              ne(tasks.status, "CANCELLED"),
              sql`${tasks.dueDate} IS NOT NULL AND ${tasks.dueDate} < NOW()`,
            ),
          );
        const [memberCount] = await db
          .select({ count: count() })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, workspaceId),
              eq(workspaceMembers.teamId, team.id),
            ),
          );
        return {
          name: team.name || "Unknown",
          totalTasks: totalTasks?.count || 0,
          completedTasks: completedTasks?.count || 0,
          activeTasks: activeTasks?.count || 0,
          overdueTasks: overdueTasks?.count || 0,
          memberCount: memberCount?.count || 0,
          completionRate: totalTasks?.count
            ? Math.round(
                ((completedTasks?.count || 0) / totalTasks.count) * 100,
              )
            : 0,
        };
      }),
    );
    return workload.sort((a, b) => b.totalTasks - a.totalTasks);
  }

  async getTeamCompletionRate(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // ... (unchanged)
    const teamList = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.workspaceId, workspaceId));
    const rates = await Promise.all(
      teamList.map(async (team) => {
        const [total] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(eq(tasks.workspaceId, workspaceId), eq(tasks.teamId, team.id)),
          );
        const [completed] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.teamId, team.id),
              eq(tasks.status, "DONE"),
            ),
          );
        const [onTime] = await db
          .select({ count: count() })
          .from(tasks)
          .where(
            and(
              eq(tasks.workspaceId, workspaceId),
              eq(tasks.teamId, team.id),
              eq(tasks.status, "DONE"),
              sql`${tasks.dueDate} IS NOT NULL AND ${tasks.updatedAt} <= ${tasks.dueDate}`,
            ),
          );
        return {
          name: team.name || "Unknown",
          total: total?.count || 0,
          completed: completed?.count || 0,
          onTime: onTime?.count || 0,
          completionRate: total?.count
            ? Math.round(((completed?.count || 0) / total.count) * 100)
            : 0,
          onTimeRate: completed?.count
            ? Math.round(((onTime?.count || 0) / completed.count) * 100)
            : 0,
        };
      }),
    );
    return rates.sort((a, b) => b.completionRate - a.completionRate);
  }

  async getPriorityTrends(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // ... (unchanged)
    const now = new Date();
    const endDate = dateTo
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
    const startDate = dateFrom
      ? new Date(dateFrom + "T00:00:00.000")
      : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const teamList = await db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.workspaceId, workspaceId));
    const allTasks = await db
      .select({
        teamId: tasks.teamId,
        priority: tasks.priority,
        status: tasks.status,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          gte(tasks.createdAt, startDate),
          lte(tasks.createdAt, endDate),
          sql`${tasks.status} != 'CANCELLED'`,
        ),
      );
    const priorityMap: Record<string, string> = {
      LOW: "Low",
      MEDIUM: "Medium",
      HIGH: "High",
      URGENT: "Urgent",
    };
    const allPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
    return teamList.map((team) => {
      const teamTasks = allTasks.filter((t) => t.teamId === team.id);
      const priorityCounts: Record<string, number> = {};
      allPriorities.forEach((p) => {
        priorityCounts[p] = 0;
      });
      teamTasks.forEach((task) => {
        const priority = task.priority || "LOW";
        if (priorityCounts[priority] !== undefined) priorityCounts[priority]++;
      });
      return {
        team: team.name || "Unknown",
        priorities: allPriorities.map((priority) => ({
          name: priorityMap[priority] || priority,
          value: priorityCounts[priority] || 0,
        })),
      };
    });
  }

  async getAttendanceTrend(
    workspaceId: string,
    dateFrom?: string,
    dateTo?: string,
  ) {
    // ... (unchanged)
    const now = new Date();
    const endDate = dateTo
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
    const startDate = dateFrom
      ? new Date(dateFrom + "T00:00:00.000")
      : new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    const records = await db
      .select({
        date: attendance.date,
        status: attendance.status,
        employeeId: attendance.userId,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate),
        ),
      )
      .orderBy(attendance.date);
    const dateMap = new Map<
      string,
      {
        present: number;
        absent: number;
        late: number;
        halfDay: number;
        onLeave: number;
      }
    >();
    records.forEach((r) => {
      const dateKey = new Date(r.date).toISOString().split("T")[0];
      if (!dateMap.has(dateKey))
        dateMap.set(dateKey, {
          present: 0,
          absent: 0,
          late: 0,
          halfDay: 0,
          onLeave: 0,
        });
      const entry = dateMap.get(dateKey)!;
      const status = (r.status || "").toUpperCase().trim();
      if (status === "PRESENT") entry.present++;
      else if (status === "ABSENT") entry.absent++;
      else if (status === "LATE") entry.late++;
      else if (status === "HALF_DAY" || status === "HALFDAY") entry.halfDay++;
      else if (
        status === "ON_LEAVE" ||
        status === "ONLEAVE" ||
        status === "LEAVE"
      )
        entry.onLeave++;
      else entry.present++;
    });
    return Array.from(dateMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  async getEmployeeDistribution(workspaceId: string) {
    // ... (unchanged)
    const members = await db
      .select({ team: teams.name, employmentType: users.employmentType })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        and(
          eq(workspaceMembers.workspaceId, workspaceId),
          eq(users.isActive, true),
        ),
      );
    const deptMap = new Map<
      string,
      { fullTime: number; contract: number; remote: number; total: number }
    >();
    members.forEach((m) => {
      const dept = m.team || "No Team";
      if (!deptMap.has(dept))
        deptMap.set(dept, { fullTime: 0, contract: 0, remote: 0, total: 0 });
      const entry = deptMap.get(dept)!;
      if (m.employmentType === "Full-time") entry.fullTime++;
      else if (m.employmentType === "Contract") entry.contract++;
      else if (m.employmentType === "Remote") entry.remote++;
      entry.total++;
    });
    return Array.from(deptMap.entries()).map(([department, data]) => ({
      department,
      ...data,
    }));
  }

  // ==================== HELPERS ====================

  private async buildFilters(
    workspaceId: string,
    memberId?: string,
    teamId?: string,
    status?: string,
    priority?: string,
  ): Promise<any[]> {
    const filters: any[] = [eq(tasks.workspaceId, workspaceId)];

    if (teamId && teamId !== "all") {
      filters.push(eq(tasks.teamId, teamId));
    }

    if (memberId && memberId !== "all") {
      const memberTasks = await db
        .select({ taskId: taskAssignees.taskId })
        .from(taskAssignees)
        .where(eq(taskAssignees.userId, memberId));

      const taskIds = memberTasks.map((t) => t.taskId);
      if (taskIds.length > 0) {
        filters.push(inArray(tasks.id, taskIds));
      } else {
        filters.push(sql`1 = 0`);
      }
    }

    if (status && status !== "all") {
      const statusMap: Record<string, string> = {
        Todo: "TODO",
        "In progress": "IN_PROGRESS",
        Done: "DONE",
        "On Hold": "REVIEW",
        Cancelled: "CANCELLED",
      };
      filters.push(eq(tasks.status, (statusMap[status] || status) as any));
    }

    if (priority && priority !== "all") {
      const priorityMap: Record<string, string> = {
        Low: "LOW",
        Medium: "MEDIUM",
        High: "HIGH",
        Urgent: "URGENT",
      };
      filters.push(
        eq(tasks.priority, (priorityMap[priority] || priority) as any),
      );
    }

    return filters;
  }
}
