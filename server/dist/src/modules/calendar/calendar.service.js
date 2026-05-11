"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CalendarService = void 0;
// src/modules/calendar/calendar.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const activity_service_1 = require("../activity/activity.service");
const activityService = new activity_service_1.ActivityService();
class CalendarService {
    /**
     * Get all tasks with due dates for calendar view
     */
    async getCalendarTasks(workspaceId, userId, userPermissions, userTeamId) {
        const taskFilter = this.getTaskFilter(userId, userPermissions, userTeamId);
        const allTasks = await drizzle_1.db
            .select({
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            description: schema_1.tasks.description,
            priority: schema_1.tasks.priority,
            status: schema_1.tasks.status,
            teamId: schema_1.tasks.teamId,
            teamName: schema_1.teams.name,
            dueDate: schema_1.tasks.dueDate,
            createdById: schema_1.tasks.createdById,
            creatorName: schema_1.users.name,
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.tasks.createdById, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.isNotNull)(schema_1.tasks.dueDate), // Only tasks with due dates
        ...taskFilter));
        // Get assignees for each task
        const tasksWithAssignees = await Promise.all(allTasks.map(async (task) => {
            const assignees = await drizzle_1.db
                .select({ id: schema_1.users.id, name: schema_1.users.name })
                .from(schema_1.taskAssignees)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, schema_1.users.id))
                .where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.taskId, task.id));
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
        }));
        return tasksWithAssignees;
    }
    /**
     * Move task to new due date (drag & drop)
     */
    async moveTaskDueDate(taskId, newDueDate, // YYYY-MM-DD from FullCalendar
    userId, workspaceId) {
        const [task] = await drizzle_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId))
            .limit(1);
        if (!task)
            throw new Error("Task not found");
        // Convert YYYY-MM-DD to Date object
        const [year, month, day] = newDueDate.split("-").map(Number);
        const dueDate = new Date(year, month - 1, day);
        // Format for display
        const formattedDate = `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/${String(year).slice(2)}`;
        await drizzle_1.db.update(schema_1.tasks).set({ dueDate }).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId));
        // Log activity
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
    // Add this method to your CalendarService class in calendar.service.ts:
    /**
     * Get all calendar events (tasks + leaves + attendance)
     */
    async getAllCalendarEvents(workspaceId, userId, userPermissions, userTeamId) {
        const canManageAll = userPermissions.includes("user_management") ||
            userPermissions.includes("hr_calendar");
        const canManageTeam = userPermissions.includes("team_management");
        // ✅ Task Calendar rule:
        // - team_management (same team): Show team members' leave CARDS
        // - user_management/hr_calendar: NO leave cards (use HR Calendar)
        // - Employee: NO leave cards
        const canSeeLeaveCards = canManageTeam && !canManageAll;
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        // Get tasks with due dates
        const tasks = await this.getCalendarTasks(workspaceId, userId, userPermissions, userTeamId);
        // ✅ Only fetch leave events for team_management (not admins, not employees)
        let leaveEvents = [];
        if (canSeeLeaveCards && userTeamId) {
            // ✅ Get team members (excluding the logged-in user)
            const teamMembers = await drizzle_1.db
                .select({ userId: schema_1.workspaceMembers.userId })
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, userTeamId)));
            const teamMemberIds = teamMembers
                .map((m) => m.userId)
                .filter((id) => id !== userId); // ✅ Exclude self
            if (teamMemberIds.length > 0) {
                const leaveConditions = [
                    (0, drizzle_orm_1.eq)(schema_1.leaves.workspaceId, workspaceId),
                    (0, drizzle_orm_1.eq)(schema_1.leaves.status, "APPROVED"),
                    (0, drizzle_orm_1.inArray)(schema_1.leaves.userId, teamMemberIds), // ✅ Only team members' leaves
                ];
                const leavesList = await drizzle_1.db
                    .select({
                    id: schema_1.leaves.id,
                    userId: schema_1.leaves.userId,
                    startDate: schema_1.leaves.startDate,
                    endDate: schema_1.leaves.endDate,
                    type: schema_1.leaves.type,
                    status: schema_1.leaves.status,
                    reason: schema_1.leaves.reason,
                    userName: schema_1.users.name,
                })
                    .from(schema_1.leaves)
                    .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.leaves.userId, schema_1.users.id))
                    .where((0, drizzle_orm_1.and)(...leaveConditions));
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
                            title: `${leave.userName} - ${this.formatLeaveType(leave.type)}`,
                            type: "leave",
                            leaveType: leave.type,
                            userName: leave.userName,
                            dueDate: dateStr,
                            initials: leave.userName
                                ?.split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase() || "",
                        });
                    }
                });
            }
        }
        // ✅ For admins, hr_calendar, and employees: leaveEvents stays as empty []
        // ✅ Get attendance ONLY for the logged-in user (NOT team members)
        const attendanceRecords = await drizzle_1.db
            .select({
            id: schema_1.attendance.id,
            date: schema_1.attendance.date,
            status: schema_1.attendance.status,
        })
            .from(schema_1.attendance)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.attendance.userId, userId), // ✅ ONLY logged-in user
        (0, drizzle_orm_1.gte)(schema_1.attendance.date, startOfMonth), (0, drizzle_orm_1.lte)(schema_1.attendance.date, endOfMonth)));
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
            leaves: leaveEvents, // ✅ Empty for admins/employees
            attendance: attendanceDays, // ✅ Only self attendance
            canSeeLeaveCards,
        };
    }
    // Add these helper methods if not already present:
    formatLeaveType(type) {
        const typeMap = {
            CASUAL: "Casual Leave",
            SICK: "Sick Leave",
            EARNED: "Earned Leave",
            UNPAID: "Unpaid Leave",
        };
        return typeMap[type] || type;
    }
    formatAttendanceStatus(status) {
        const statusMap = {
            PRESENT: "Present",
            LATE: "Late",
            ABSENT: "Absent",
            HALF_DAY: "Half Day",
            ON_LEAVE: "On Leave",
        };
        return statusMap[status] || status;
    }
    // ==================== HELPERS ====================
    getTaskFilter(userId, userPermissions, userTeamId) {
        const canManageAll = userPermissions.includes("user_management");
        const canManageTeam = userPermissions.includes("team_management");
        if (canManageAll)
            return [];
        if (canManageTeam && userTeamId) {
            return [(0, drizzle_orm_1.eq)(schema_1.tasks.teamId, userTeamId)];
        }
        const filters = [];
        if (userTeamId)
            filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.teamId, userTeamId));
        filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId));
        return [(0, drizzle_orm_1.or)(...filters)];
    }
    formatPriority(priority) {
        return priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase();
    }
    formatStatus(status) {
        const statusMap = {
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
exports.CalendarService = CalendarService;
