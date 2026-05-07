// src/modules/calendar/calendar.service.ts
import { db } from "../../db/drizzle";
import {
  tasks,
  users,
  teams,
  taskAssignees,
  leaves,
  attendance,
  workspaceMembers,
  leaveTypes,
} from "../../db/schema";
import { eq, and, or, isNotNull, gte, lte, inArray } from "drizzle-orm";
import { ActivityService } from "../activity/activity.service";

const activityService = new ActivityService();

export class CalendarService {
  /**
   * Get all tasks with due dates for calendar view
   */
  async getCalendarTasks(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ) {
    const taskFilter = this.getTaskFilter(userId, userPermissions, userTeamId);

    const allTasks = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        description: tasks.description,
        priority: tasks.priority,
        status: tasks.status,
        teamId: tasks.teamId,
        teamName: teams.name,
        dueDate: tasks.dueDate,
        createdById: tasks.createdById,
        creatorName: users.name,
      })
      .from(tasks)
      .leftJoin(teams, eq(tasks.teamId, teams.id))
      .leftJoin(users, eq(tasks.createdById, users.id))
      .where(
        and(
          eq(tasks.workspaceId, workspaceId),
          isNotNull(tasks.dueDate),
          ...taskFilter,
        ),
      );

    // Get assignees for each task
    const tasksWithAssignees = await Promise.all(
      allTasks.map(async (task) => {
        const assignees = await db
          .select({ id: users.id, name: users.name })
          .from(taskAssignees)
          .innerJoin(users, eq(taskAssignees.userId, users.id))
          .where(eq(taskAssignees.taskId, task.id));

        return {
          ...task,
          assignees: assignees.map((a) => a.name),
          assigneeIds: assignees.map((a) => a.id),
          priority: this.formatPriority(task.priority || "MEDIUM"),
          status: this.formatStatus(task.status || "TODO"),
          dueDate: task.dueDate
            ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "2-digit",
              })
            : null,
          initials: assignees
            .map((a) => a.name.charAt(0).toUpperCase())
            .join(""),
        };
      }),
    );

    return tasksWithAssignees;
  }

  /**
   * Move task to new due date (drag & drop)
   */
  async moveTaskDueDate(
    taskId: string,
    newDueDate: string,
    userId: string,
    workspaceId: string,
  ) {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, taskId))
      .limit(1);

    if (!task) throw new Error("Task not found");

    const [year, month, day] = newDueDate.split("-").map(Number);
    const dueDate = new Date(year, month - 1, day);

    const formattedDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(year).slice(2)}`;

    await db.update(tasks).set({ dueDate }).where(eq(tasks.id, taskId));

    await activityService.logActivity({
      userId,
      workspaceId,
      action: `changed due date of "${task.title}" to ${formattedDate}`,
      entityType: "task",
      entityId: taskId,
      details: { taskTitle: task.title, newDueDate: formattedDate },
    });

    return { success: true, taskId, newDueDate: formattedDate };
  }

  /**
   * Get all calendar events (tasks + leaves + attendance)
   */
  async getAllCalendarEvents(
    workspaceId: string,
    userId: string,
    userPermissions: string[],
    userTeamId?: string | null,
  ) {
    const canManageAll =
      userPermissions.includes("user_management") ||
      userPermissions.includes("hr_calendar");
    const canManageTeam = userPermissions.includes("team_management");

    const canSeeLeaveCards = canManageTeam && !canManageAll;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get tasks with due dates
    const tasks = await this.getCalendarTasks(
      workspaceId,
      userId,
      userPermissions,
      userTeamId,
    );

    let leaveEvents: any[] = [];

    if (canSeeLeaveCards && userTeamId) {
      // Get team members (excluding the logged-in user)
      const teamMembers = await db
        .select({ userId: workspaceMembers.userId })
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.workspaceId, workspaceId),
            eq(workspaceMembers.teamId, userTeamId),
          ),
        );
      const teamMemberIds = teamMembers
        .map((m) => m.userId)
        .filter((id) => id !== userId);

      if (teamMemberIds.length > 0) {
        const leaveConditions: any[] = [
          eq(leaves.workspaceId, workspaceId),
          eq(leaves.status, "APPROVED"),
          inArray(leaves.userId, teamMemberIds),
        ];

        // FIXED: Join with leaveTypes to get leave type name
        const leavesList = await db
          .select({
            id: leaves.id,
            userId: leaves.userId,
            startDate: leaves.startDate,
            endDate: leaves.endDate,
            leaveTypeId: leaves.leaveTypeId, // FIXED: Changed from type
            leaveTypeName: leaveTypes.name, // FIXED: Get name from join
            status: leaves.status,
            reason: leaves.reason,
            userName: users.name,
          })
          .from(leaves)
          .leftJoin(users, eq(leaves.userId, users.id))
          .leftJoin(leaveTypes, eq(leaves.leaveTypeId, leaveTypes.id)) // FIXED: Join with leaveTypes
          .where(and(...leaveConditions));

        // Convert leaves to calendar events (cards)
        leavesList.forEach((leave) => {
          const start = new Date(leave.startDate);
          const end = new Date(leave.endDate);
          for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "2-digit",
            });
            leaveEvents.push({
              id: `leave-${leave.id}-${dateStr}`,
              title: `${leave.userName} - ${leave.leaveTypeName || "Leave"}`, // FIXED: Use name from DB
              type: "leave",
              leaveType: leave.leaveTypeName, // FIXED: Use name
              userName: leave.userName,
              dueDate: dateStr,
              initials:
                leave.userName
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase() || "",
            });
          }
        });
      }
    }

    // Get attendance ONLY for the logged-in user
    const attendanceRecords = await db
      .select({
        id: attendance.id,
        date: attendance.date,
        status: attendance.status,
      })
      .from(attendance)
      .where(
        and(
          eq(attendance.workspaceId, workspaceId),
          eq(attendance.userId, userId),
          gte(attendance.date, startOfMonth),
          lte(attendance.date, endOfMonth),
        ),
      );

    const attendanceDays = attendanceRecords.map((record) => ({
      date: new Date(record.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
      status: record.status,
    }));

    return {
      tasks,
      leaves: leaveEvents,
      attendance: attendanceDays,
      canSeeLeaveCards,
    };
  }

  // FIXED: Removed formatLeaveType method since we use dynamic names from DB
  // The leave type name comes directly from leaveTypes table now

  private formatAttendanceStatus(status: string): string {
    const statusMap: Record<string, string> = {
      PRESENT: "Present",
      LATE: "Late",
      ABSENT: "Absent",
      HALF_DAY: "Half Day",
      ON_LEAVE: "On Leave",
    };
    return statusMap[status] || status;
  }

  // ==================== HELPERS ====================

  private getTaskFilter(
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
      REVIEW: "On Hold",
      DONE: "Done",
      CANCELLED: "Cancelled",
      ON_HOLD: "On Hold",
    };
    return statusMap[status] || status;
  }
}
