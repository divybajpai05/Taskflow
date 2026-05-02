// src/modules/kanban/kanban.service.ts
import { db } from "../../db/drizzle";
import { tasks, users, teams, taskAssignees } from "../../db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { ActivityService } from "../activity/activity.service";

const activityService = new ActivityService();

export class KanbanService {
  /**
   * Get all tasks for kanban board grouped by team and status
   */
  async getBoard(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
    filters?: { search?: string; priority?: string },
  ) {
    const taskFilter = this.getKanbanTaskFilter(
      userId,
      userPermissions,
      userTeamId,
    );

    const allTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        teamId: tasks.teamId,
        teamName: teams.name,
        assigneeId: tasks.assigneeId,
        dueDate: tasks.dueDate,
        createdById: tasks.createdById,
        creatorName: users.name,
        createdAt: tasks.createdAt,
      })
      .from(tasks)
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(users, eq(tasks.createdById, users.id))
      .where(and(eq(tasks.workspaceId, workspaceId), ...taskFilter))
      .orderBy(desc(tasks.createdAt));

    // Get assignees for each task
    const tasksWithAssignees = await Promise.all(
      allTasks.map(async (task) => {
        const assignees = await db
          .select({ name: users.name })
          .from(taskAssignees)
          .innerJoin(users, eq(taskAssignees.userId, users.id))
          .where(eq(taskAssignees.taskId, task.id));

        return {
          ...task,
          assignees: assignees.map((a) => a.name),
          priority: this.formatPriority(task.priority || "MEDIUM"),
          status: this.formatStatus(task.status || "TODO"),
          dueDate: task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : null,
        };
      }),
    );

    // Apply search filter
    let filtered = tasksWithAssignees;
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = tasksWithAssignees.filter((t) =>
        t.title?.toLowerCase().includes(search),
      );
    }

    // Apply priority filter
    if (filters?.priority && filters.priority !== "All") {
      const priorityMap: Record<string, string> = {
        Urgent: "URGENT",
        High: "HIGH",
        Medium: "MEDIUM",
        Low: "LOW",
      };
      const dbPriority = priorityMap[filters.priority];
      filtered = tasksWithAssignees.filter(
        (t) => t.priority === filters.priority,
      );
    }

    // Group by team and status
    const board: any = {};

    filtered.forEach((task) => {
      const teamName = task.teamName || "No Team";
      const status = task.status;

      if (!board[teamName]) board[teamName] = {};
      if (!board[teamName][status]) board[teamName][status] = [];

      board[teamName][status].push(task);
    });

    return board;
  }

  /**
   * Move task to new status (drag & drop)
   */
  async moveTask(
    taskId: string,
    newStatus: string,
    userId: string,
    workspaceId: string,
  ) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) throw new Error("Task not found");

    const statusMap: Record<string, string> = {
      Todo: "TODO",
      "In progress": "IN_PROGRESS",
      "On Hold": "ON_HOLD",
      Done: "DONE",
      Review:"REVIEW",
      Cancelled: "CANCELLED",
    };

    const dbStatus = statusMap[newStatus] || newStatus.toUpperCase();
    const oldStatus = this.formatStatus(task.status || "TODO");

    await db
      .update(tasks)
      .set({ status: dbStatus as any })
      .where(eq(tasks.id, taskId));

    // Log activity
    await activityService.logActivity({
      userId,
      workspaceId,
      action: `moved "${task.title}" to ${newStatus}`,
      entityType: "task",
      entityId: taskId,
      details: { taskTitle: task.title, oldStatus, newStatus },
    });

    return { success: true, taskId, oldStatus, newStatus };
  }

  // ==================== HELPERS ====================

  private getKanbanTaskFilter(
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ): any[] {
    const canManageAll = userPermissions.includes("user_management");
    const canManageTeam = userPermissions.includes("team_management");

    if (canManageAll) return [];

    if (canManageTeam && userTeamId) {
      return [eq(tasks.teamId, userTeamId)];
    }

    const filters: any[] = [];
    if (userTeamId) filters.push(eq(tasks.teamId, userTeamId));
    filters.push(eq(tasks.assigneeId, userId));

    return [or(...filters)];
  }

  private formatPriority(priority: string): string {
    return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
  }

  private formatStatus(status: string): string {
    const statusMap: Record<string, string> = {
      TODO: "Todo",
      IN_PROGRESS: "In progress",
      REVIEW: "Review",
      DONE: "Done",
      CANCELLED: "Cancelled",
      ON_HOLD: "On Hold",
    };
    return statusMap[status] || status.replace("_", " ");
  }
}
