import { db } from "../../db/drizzle";
import {
  tasks,
  users,
  workspaceMembers,
  teams,
  activityLogs,
  roles,
} from "../../db/schema";
import { eq, and, count, ne, or, desc, inArray } from "drizzle-orm";

export class DashboardService {
  /**
   * Get dashboard overview stats for a workspace
   * Filtered by user permissions
   */
  async getOverviewStats(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ) {
    const taskFilter = this.getTaskFilter(
      workspaceId,
      userId,
      userPermissions,
      userTeamId,
    );
    const peopleFilter = this.getPeopleFilter(
      workspaceId,
      userId,
      userPermissions,
      userTeamId,
    );

    const [totalTasks] = await db
      .select({ count: count() })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), ...taskFilter));

    const taskStatuses = await db
      .select({ status: tasks.status, count: count() })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), ...taskFilter))
      .groupBy(tasks.status);

    const taskPriorities = await db
      .select({ priority: tasks.priority, count: count() })
      .from(tasks)
      .where(and(eq(tasks.workspaceId, workspaceId), ...taskFilter))
      .groupBy(tasks.priority);

    const departmentHeadcount = await db
      .select({ team: teams.name, count: count() })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), ...peopleFilter),
      )
      .groupBy(teams.name);

    const [totalWorkforce] = await db
      .select({ count: count() })
      .from(workspaceMembers)
      .where(
        and(eq(workspaceMembers.workspaceId, workspaceId), ...peopleFilter),
      );

    const priorityOrder: Record<string, number> = {
      URGENT: 4,
      HIGH: 3,
      MEDIUM: 2,
      LOW: 1,
    };
    let highestPriority = "Medium";
    let highestCount = 0;

    taskPriorities.forEach((p: any) => {
      const pName = p.priority
        ? p.priority.charAt(0).toUpperCase() + p.priority.slice(1).toLowerCase()
        : "Medium";
      if (
        p.count > highestCount ||
        (p.count === highestCount &&
          priorityOrder[p.priority] >
            priorityOrder[highestPriority.toUpperCase()])
      ) {
        highestCount = p.count;
        highestPriority = pName;
      }
    });

    return {
      totalTasks: totalTasks?.count || 0,
      taskStatuses: taskStatuses.map((s: any) => ({
        status: s.status ? s.status.replace("_", " ") : "Unknown",
        count: s.count,
      })),
      taskPriorities: taskPriorities.map((p: any) => ({
        priority: p.priority
          ? p.priority.charAt(0).toUpperCase() +
            p.priority.slice(1).toLowerCase()
          : "Medium",
        count: p.count,
      })),
      departmentHeadcount: departmentHeadcount.map((d: any) => ({
        department: d.team || "No Team",
        count: d.count,
      })),
      totalWorkforce: totalWorkforce?.count || 0,
      highestPriority,
      highestPriorityCount: highestCount,
    };
  }

  /**
   * Get active tasks for the queue
   */
  async getActiveTasks(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
    limit: number = 5,
    offset: number = 0,
  ) {
    const filter = this.getTaskFilter(
      workspaceId,
      userId,
      userPermissions,
      userTeamId,
    );

    // Active statuses: not Done, not Cancelled
    const activeFilter = [
      ne(tasks.status, "DONE"),
      ne(tasks.status, "CANCELLED"),
    ];

    // Get total count
    const [totalCount] = await db
      .select({ count: count() })
      .from(tasks)
      .where(
        and(eq(tasks.workspaceId, workspaceId), ...activeFilter, ...filter),
      );

    // Get tasks
    const activeTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        teamName: teams.name,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        createdBy: users.name,
      })
      .from(tasks)
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(users, eq(tasks.createdById, users.id))
      .where(
        and(eq(tasks.workspaceId, workspaceId), ...activeFilter, ...filter),
      )
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      tasks: activeTasks.map((task) => ({
        id: task.id,
        name: task.title,
        assignedTeam: task.teamName || "No Team",
        priority: task.priority
          ? task.priority.charAt(0).toUpperCase() +
            task.priority.slice(1).toLowerCase()
          : "Medium",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "2-digit",
            })
          : "No date",
        status: task.status
          ? task.status.charAt(0).toUpperCase() +
            task.status.slice(1).toLowerCase().replace("_", " ")
          : "Todo",
        createdBy: {
          id: "",
          name: task.createdBy || "Unknown",
        },
      })),
      total: totalCount?.count || 0,
      showing: activeTasks.length,
    };
  }

  /**
   * Get team workload for a workspace (filtered)
   */
  async getTeamWorkload(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ) {
    const filter = this.getTaskFilter(
      workspaceId,
      userId,
      userPermissions,
      userTeamId,
    );

    const allTasks = await db
      .select({
        teamName: teams.name,
        status: tasks.status,
        assigneeName: users.name,
      })
      .from(tasks)
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .innerJoin(users, eq(tasks.assigneeId, users.id))
      .where(and(eq(tasks.workspaceId, workspaceId), ...filter));

    const teamMap = new Map<
      string,
      Map<string, { completed: number; total: number }>
    >();
    allTasks.forEach((task) => {
      const teamName = task.teamName || "No Team";
      const memberName = task.assigneeName || "Unassigned";
      if (!teamMap.has(teamName)) teamMap.set(teamName, new Map());
      const memberMap = teamMap.get(teamName)!;
      if (!memberMap.has(memberName))
        memberMap.set(memberName, { completed: 0, total: 0 });
      const stats = memberMap.get(memberName)!;
      stats.total++;
      if (task.status === "DONE") stats.completed++;
    });

    const result: {
      name: string;
      members: { name: string; completed: number; total: number }[];
    }[] = [];
    teamMap.forEach((memberMap, teamName) => {
      const members: { name: string; completed: number; total: number }[] = [];
      memberMap.forEach((stats, name) => members.push({ name, ...stats }));
      members.sort((a, b) => b.total - a.total);
      result.push({ name: teamName, members });
    });
    result.sort((a, b) => b.members.length - a.members.length);
    return result;
  }

  /**
   * Get overdue tasks for a workspace (filtered)
   */
  async getOverdueTasks(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const filter = this.getTaskFilter(
      workspaceId,
      userId,
      userPermissions,
      userTeamId,
    );

    const allTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        teamName: teams.name,
        priority: tasks.priority,
        status: tasks.status,
        dueDate: tasks.dueDate,
        assigneeName: users.name,
      })
      .from(tasks)
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(users, eq(tasks.assigneeId, users.id))
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          ne(tasks.status, "DONE"),
          ne(tasks.status, "CANCELLED"),
          ...filter,
        ),
      );

    return allTasks
      .filter((task) => task.dueDate && new Date(task.dueDate) < today)
      .map((task) => ({
        id: task.id,
        title: task.title,
        teamName: task.teamName || "No Team",
        priority: task.priority
          ? task.priority.charAt(0).toUpperCase() +
            task.priority.slice(1).toLowerCase()
          : "Medium",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            })
          : "N/A",
        assignees: task.assigneeName ? [task.assigneeName] : [],
      }));
  }

  // ==================== FILTER HELPERS ====================

  private getTaskFilter(
    _workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ): any[] {
    const canManageAll = userPermissions.includes("user_management");
    const canManageTeam = userPermissions.includes("team_management");

    if (canManageAll) {
      return [];
    }

    if (canManageTeam && userTeamId) {
      return [eq(tasks.teamId, userTeamId)];
    }

    const filters: any[] = [];
    if (userTeamId) {
      filters.push(eq(tasks.teamId, userTeamId));
    }
    filters.push(eq(tasks.assigneeId, userId));

    return [or(...filters)];
  }

  private getPeopleFilter(
    _workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ): any[] {
    const canManageAll = userPermissions.includes("user_management");

    if (canManageAll) {
      return [];
    }

    if (userTeamId) {
      return [eq(workspaceMembers.teamId, userTeamId)];
    }

    return [eq(workspaceMembers.userId, userId)];
  }

  async getLiveActivity(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
    limit: number = 10,
  ) {
    const canManageAll = userPermissions.includes("user_management");
    const canManageTeam = userPermissions.includes("team_management");

    let teamMemberIds: string[] = [];

    if (!canManageAll) {
      if (canManageTeam && userTeamId) {
        // Manager: Get all members of their team
        const teamMembers = await db
          .select({ userId: workspaceMembers.userId })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, workspaceId),
              eq(workspaceMembers.teamId, userTeamId),
            ),
          );
        teamMemberIds = teamMembers.map((m) => m.userId);
      } else if (userTeamId) {
        // Regular employee: Get team members
        const teamMembers = await db
          .select({ userId: workspaceMembers.userId })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.workspaceId, workspaceId),
              eq(workspaceMembers.teamId, userTeamId),
            ),
          );
        teamMemberIds = teamMembers.map((m) => m.userId);
      } else {
        // No team: Only own activity
        teamMemberIds = [userId];
      }
    }

    // Build filter
    const activityFilter: any[] = [];
    activityFilter.push(eq(activityLogs.workspaceId, workspaceId));

    if (!canManageAll && teamMemberIds.length > 0) {
      activityFilter.push(inArray(activityLogs.userId, teamMemberIds));
    }

    // ✅ Get total count FIRST (before limit)
    const [totalResult] = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(and(...activityFilter));

    const totalCount = totalResult?.count || 0;

    // Get activities with limit
    const activities = await db
      .select({
        id: activityLogs.id,
        userId: activityLogs.userId,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        createdAt: activityLogs.createdAt,
      })
      .from(activityLogs)
      .where(and(...activityFilter))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    // Get user names and entity names
    const activitiesWithDetails = await Promise.all(
      activities.map(async (activity) => {
        // Get actor name
        const [actor] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, activity.userId))
          .limit(1);

        // Get target entity name based on type
        let targetName = "";
        if (activity.entityType === "task" && activity.entityId) {
          const [task] = await db
            .select({ title: tasks.title })
            .from(tasks)
            .where(eq(tasks.id, activity.entityId))
            .limit(1);
          targetName = task?.title || "a task";
        } else if (activity.entityType === "user" && activity.entityId) {
          const [user] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, activity.entityId))
            .limit(1);
          targetName = user?.name || "a user";
        } else if (activity.entityType === "team" && activity.entityId) {
          const [team] = await db
            .select({ name: teams.name })
            .from(teams)
            .where(eq(teams.id, activity.entityId))
            .limit(1);
          targetName = team?.name || "a team";
        } else if (activity.entityType === "role" && activity.entityId) {
          const [role] = await db
            .select({ name: roles.name })
            .from(roles)
            .where(eq(roles.id, activity.entityId))
            .limit(1);
          targetName = role?.name || "a role";
        } else if (activity.entityType === "workspace") {
          targetName = "workspace";
        } else if (activity.entityType === "leave") {
          targetName = "leave";
        } else if (activity.entityType === "attendance") {
          targetName = "attendance";
        } else {
          targetName = activity.entityType || "item";
        }

        return {
          id: String(activity.id),
          user: actor?.name || "Unknown User",
          action: activity.action, // ✅ Action already has descriptive text from logging
          target: targetName,
          time: new Date(activity.createdAt).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          }),
          date: new Date(activity.createdAt).toLocaleDateString("en-GB"),
          status: "success",
        };
      }),
    );

    // ✅ Return both activities and total count
    return {
      activities: activitiesWithDetails,
      total: totalCount,
    };
  }

  private formatAction(action: string): string {
    if (action && action.includes(" ")) {
      return action;
    }

    const actionMap: Record<string, string> = {
      task_created: "created",
      task_updated: "updated",
      task_status_changed: "changed status of",
      task_deleted: "deleted",
      user_created: "added user",
      user_updated: "updated user",
      user_deleted: "removed user",
      team_created: "created team",
      workspace_created: "created workspace",
      attendance_marked: "marked attendance for",
      leave_applied: "applied for leave",
      leave_approved: "approved leave for",
      leave_rejected: "rejected leave for",
    };
    return actionMap[action] || "modified";
  }
}
