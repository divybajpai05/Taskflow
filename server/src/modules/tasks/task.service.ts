// src/modules/tasks/task.service.ts
import { db } from "../../db/drizzle";
import {
  tasks,
  users,
  teams,
  workspaceMembers,
  taskAssignees,
  workspaces,
} from "../../db/schema";
import { eq, and, like, or, desc, inArray, count } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { EmailService as BrevoEmailService } from "../auth/email.service";
import { ActivityService } from "../activity/activity.service";

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority: string;
  status: string;
  teamId?: string;
  assigneeIds?: string[];
  dueDate?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  priority?: string;
  status?: string;
  teamId?: string;
  assigneeIds?: string[];
  dueDate?: string;
}

const brevoEmailService = new BrevoEmailService();
const activityService = new ActivityService();

export class TaskService {
  /**
   * Get all tasks in a workspace with filters
   */
  async getTasks(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
    filters?: {
      search?: string;
      teamId?: string;
      priority?: string;
      status?: string;
    },
  ) {
    const conditions: any[] = [eq(tasks.workspaceId, workspaceId)];

    console.log("🔵 getTasks - User:", userId);
    console.log("🔵 getTasks - Permissions:", userPermissions);
    console.log("🔵 getTasks - TeamId:", userTeamId);

    const canSeeAllTasks =
      userPermissions.includes("team_management") ||
      userPermissions.includes("user_management") ||
      userPermissions.includes("admin");

    console.log("🔵 getTasks - canSeeAllTasks:", canSeeAllTasks);

    if (!canSeeAllTasks) {
      console.log("🔵 getTasks - Applying team filter...");
      if (userTeamId) {
        const assignedTaskIds = await db
          .select({ taskId: taskAssignees.taskId })
          .from(taskAssignees)
          .where(eq(taskAssignees.userId, userId));

        const assignedIds = assignedTaskIds.map((a) => a.taskId);

        if (assignedIds.length > 0) {
          conditions.push(
            or(
              eq(tasks.teamId, userTeamId),
              eq(tasks.assigneeId, userId),
              inArray(tasks.id, assignedIds),
            ),
          );
        } else {
          conditions.push(
            or(eq(tasks.teamId, userTeamId), eq(tasks.assigneeId, userId)),
          );
        }
      } else {
        const assignedTaskIds = await db
          .select({ taskId: taskAssignees.taskId })
          .from(taskAssignees)
          .where(eq(taskAssignees.userId, userId));

        const assignedIds = assignedTaskIds.map((a) => a.taskId);

        if (assignedIds.length > 0) {
          conditions.push(
            or(eq(tasks.assigneeId, userId), inArray(tasks.id, assignedIds)),
          );
        } else {
          conditions.push(eq(tasks.assigneeId, userId));
        }
      }
    }

    if (filters?.teamId && filters.teamId !== "All") {
      conditions.push(eq(tasks.teamId, filters.teamId));
    }

    if (filters?.status && filters.status !== "All") {
      const statusMap: Record<
        string,
        "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE" | "CANCELLED"
      > = {
        Todo: "TODO",
        "In progress": "IN_PROGRESS",
        Done: "DONE",
        "On Hold": "ON_HOLD",
        Cancelled: "CANCELLED",
      };
      conditions.push(eq(tasks.status, statusMap[filters.status]));
    }

    if (filters?.priority && filters.priority !== "All") {
      const priorityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "URGENT"> =
        {
          Urgent: "URGENT",
          High: "HIGH",
          Medium: "MEDIUM",
          Low: "LOW",
        };
      conditions.push(eq(tasks.priority, priorityMap[filters.priority]));
    }

    const taskList = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        teamId: tasks.teamId,
        teamName: teams.name,
        assigneeId: tasks.assigneeId,
        createdById: tasks.createdById,
        creatorName: users.name,
        dueDate: tasks.dueDate,
        createdAt: tasks.createdAt,
        updatedAt: tasks.updatedAt,
      })
      .from(tasks)
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(users, eq(tasks.createdById, users.id))
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt));

    let filtered = taskList;
    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = taskList.filter(
        (t) =>
          t.title?.toLowerCase().includes(search) ||
          t.description?.toLowerCase().includes(search),
      );
    }

    const tasksWithAssignees = await Promise.all(
      filtered.map(async (task) => {
        let assignees: any[] = [];
        try {
          assignees = await db
            .select({ id: users.id, name: users.name, email: users.email })
            .from(taskAssignees)
            .innerJoin(users, eq(taskAssignees.userId, users.id))
            .where(eq(taskAssignees.taskId, task.id));
        } catch (error) {
          console.warn("Could not fetch assignees:", error);
        }

        return {
          ...task,
          assignees: assignees.map((a) => a.name),
          assigneeIds: assignees.map((a) => a.id),
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

    return tasksWithAssignees;
  }

  /**
   * Create a new task
   */
  async createTask(
    input: CreateTaskInput,
    workspaceId: string,
    createdById: string,
    userPermissions: string[],
  ) {
    const {
      title,
      description,
      priority,
      status,
      teamId,
      assigneeIds,
      dueDate,
    } = input;

    const canManageAll =
      userPermissions.includes("team_management") ||
      userPermissions.includes("user_management");

    let finalAssigneeIds = assigneeIds;
    let finalTeamId = teamId;

    if (!canManageAll) {
      finalAssigneeIds = [createdById];

      const [memberData] = await db
        .select({ teamId: workspaceMembers.teamId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.userId, createdById),
            eq(workspaceMembers.workspaceId, workspaceId),
          ),
        )
        .limit(1);

      finalTeamId = memberData?.teamId || teamId;

      console.log(
        "🔵 Regular user creating task - workspace team:",
        finalTeamId,
        "forced assignee:",
        createdById,
      );
    }

    const taskId = uuidv4();

    const statusMap: Record<
      string,
      "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE" | "CANCELLED"
    > = {
      Todo: "TODO",
      "In progress": "IN_PROGRESS",
      Done: "DONE",
      "On Hold": "ON_HOLD",
      Cancelled: "CANCELLED",
    };

    const priorityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "URGENT"> = {
      Urgent: "URGENT",
      High: "HIGH",
      Medium: "MEDIUM",
      Low: "LOW",
    };

    let parsedDueDate: Date | null = null;
    if (dueDate && dueDate.includes("/")) {
      const parts = dueDate.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        parsedDueDate = new Date(2000 + year, month - 1, day);
      }
    }

    await db.insert(tasks).values({
      id: taskId,
      title,
      description: description || null,
      priority: priorityMap[priority] || "MEDIUM",
      status: statusMap[status] || "TODO",
      teamId: finalTeamId || null,
      assigneeId: finalAssigneeIds?.[0] || null,
      createdById,
      workspaceId,
      dueDate: parsedDueDate,
    });

    if (finalAssigneeIds && finalAssigneeIds.length > 0) {
      await db.insert(taskAssignees).values(
        finalAssigneeIds.map((userId) => ({
          taskId: taskId,
          userId: userId,
        })),
      );
    }

    // ✅ Log activity for task creation
    await activityService.logActivity({
      userId: createdById,
      workspaceId: workspaceId,
      action: `created task "${title}"`,
      entityType: "task",
      entityId: taskId,
      details: { taskTitle: title, priority, status, teamId: finalTeamId },
    });

    if (finalAssigneeIds && finalAssigneeIds.length > 0) {
      try {
        const assignees = await db
          .select({ id: users.id, name: users.name, email: users.email })
          .from(users)
          .where(inArray(users.id, finalAssigneeIds));

        const [creator] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, createdById))
          .limit(1);

        const [workspace] = await db
          .select({ name: workspaces.name })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);

        for (const assignee of assignees) {
          await brevoEmailService.sendTaskAssignmentEmail(
            assignee.email,
            assignee.name,
            title,
            description || "",
            creator?.name || "A team member",
            dueDate || "Not set",
            workspace?.name || "Your Workspace",
          );
        }

        console.log(
          `✅ Task assignment emails sent to ${assignees.length} user(s)`,
        );
      } catch (error) {
        console.error("Failed to send task assignment emails:", error);
      }
    }

    return { success: true, taskId };
  }

  /**
   * Update a task
   */
  async updateTask(
    taskId: string,
    input: UpdateTaskInput,
    userId: string,
    userPermissions: string[],
    workspaceId: string,
  ) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!task) throw new Error("Task not found");

    const canManageAll =
      userPermissions.includes("team_management") ||
      userPermissions.includes("user_management");

    const isCreator = task.createdById === userId;

    const [assignee] = await db
      .select()
      .from(taskAssignees)
      .where(
        and(eq(taskAssignees.taskId, taskId), eq(taskAssignees.userId, userId)),
      )
      .limit(1);
    const isAssignee = !!assignee;

    const canEdit = canManageAll || isCreator || isAssignee;

    if (!canEdit) {
      throw new Error("You don't have permission to edit this task");
    }

    if (input.assigneeIds && !canManageAll) {
      input.assigneeIds = [userId];
    }

    const statusMap: Record<
      string,
      "TODO" | "IN_PROGRESS" | "ON_HOLD" | "DONE" | "CANCELLED"
    > = {
      Todo: "TODO",
      "In progress": "IN_PROGRESS",
      Done: "DONE",
      "On Hold": "ON_HOLD",
      Cancelled: "CANCELLED",
    };

    const priorityMap: Record<string, "LOW" | "MEDIUM" | "HIGH" | "URGENT"> = {
      Urgent: "URGENT",
      High: "HIGH",
      Medium: "MEDIUM",
      Low: "LOW",
    };

    const updateData: any = {};
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined)
      updateData.description = input.description;
    if (input.priority) {
      updateData.priority =
        priorityMap[input.priority] || input.priority.toUpperCase();
    }

    // ✅ Track if status is changing
    const statusChanged =
      input.status && statusMap[input.status] !== task.status;
    if (input.status) {
      updateData.status = statusMap[input.status] || input.status.toUpperCase();
    }

    if (input.teamId !== undefined) {
      if (!canManageAll) {
        const [memberData] = await db
          .select({ teamId: workspaceMembers.teamId })
          .from(workspaceMembers)
          .where(
            and(
              eq(workspaceMembers.userId, userId),
              eq(workspaceMembers.workspaceId, task.workspaceId),
            ),
          )
          .limit(1);
        updateData.teamId = memberData?.teamId || input.teamId;
      } else {
        updateData.teamId = input.teamId;
      }
    }

    if (input.assigneeIds !== undefined && canManageAll) {
      await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));
      if (input.assigneeIds.length > 0) {
        await db
          .insert(taskAssignees)
          .values(input.assigneeIds.map((userId) => ({ taskId, userId })));
        updateData.assigneeId = input.assigneeIds[0];
      } else {
        updateData.assigneeId = null;
      }
    }

    if (input.dueDate && input.dueDate.includes("/")) {
      const parts = input.dueDate.split("/");
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number);
        updateData.dueDate = new Date(2000 + year, month - 1, day);
      }
    } else if (input.dueDate) {
      updateData.dueDate = new Date(input.dueDate);
    }

    await db.update(tasks).set(updateData).where(eq(tasks.id, taskId));

    // ✅ Log activity ONCE - based on what changed
    const taskTitle = input.title || task.title;

    if (statusChanged) {
      // Only status changed
      await activityService.logActivity({
        userId: userId,
        workspaceId: workspaceId,
        action: `moved "${taskTitle}" to ${input.status}`,
        entityType: "task",
        entityId: taskId,
        details: { taskTitle, oldStatus: task.status, newStatus: input.status },
      });
    } else {
      // Other changes (title, description, assignees, etc.)
      await activityService.logActivity({
        userId: userId,
        workspaceId: workspaceId,
        action: `updated task "${taskTitle}"`,
        entityType: "task",
        entityId: taskId,
        details: { taskTitle },
      });
    }

    return { success: true };
  }

  /**
   * Delete a task
   */
  async deleteTask(
    taskId: string,
    userId: string,
    userPermissions: string[],
    workspaceId: string,
  ) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);
    if (!task) throw new Error("Task not found");

    const canManageAll =
      userPermissions.includes("team_management") ||
      userPermissions.includes("user_management");

    const isCreator = task.createdById === userId;

    const canDelete = canManageAll || isCreator;

    if (!canDelete) {
      throw new Error("You can only delete tasks you created");
    }

    // ✅ Log activity BEFORE deleting
    await activityService.logActivity({
      userId: userId,
      workspaceId: workspaceId,
      action: `deleted task "${task.title}"`,
      entityType: "task",
      entityId: taskId,
      details: { taskTitle: task.title },
    });

    // Delete task_assignees first
    await db.delete(taskAssignees).where(eq(taskAssignees.taskId, taskId));

    // Delete the task
    await db.delete(tasks).where(eq(tasks.id, taskId));

    return { success: true };
  }

  /**
   * Get teams for a workspace (for dropdown)
   */
  async getTeams(workspaceId: string) {
    return db
      .select({ id: teams.id, name: teams.name })
      .from(teams)
      .where(eq(teams.workspaceId, workspaceId));
  }
}
