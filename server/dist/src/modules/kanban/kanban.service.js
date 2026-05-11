"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KanbanService = void 0;
// src/modules/kanban/kanban.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const activity_service_1 = require("../activity/activity.service");
const activityService = new activity_service_1.ActivityService();
class KanbanService {
    /**
     * Get all tasks for kanban board grouped by team and status
     */
    async getBoard(workspaceId, userId, userPermissions, userTeamId, filters) {
        const taskFilter = this.getKanbanTaskFilter(userId, userPermissions, userTeamId);
        const allTasks = await drizzle_1.db
            .select({
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            description: schema_1.tasks.description,
            priority: schema_1.tasks.priority,
            status: schema_1.tasks.status,
            teamId: schema_1.tasks.teamId,
            teamName: schema_1.teams.name,
            assigneeId: schema_1.tasks.assigneeId,
            dueDate: schema_1.tasks.dueDate,
            createdById: schema_1.tasks.createdById,
            creatorName: schema_1.users.name,
            createdAt: schema_1.tasks.createdAt,
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.tasks.createdById, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...taskFilter))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
        // Get assignees for each task
        const tasksWithAssignees = await Promise.all(allTasks.map(async (task) => {
            const assignees = await drizzle_1.db
                .select({ name: schema_1.users.name })
                .from(schema_1.taskAssignees)
                .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, schema_1.users.id))
                .where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.taskId, task.id));
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
        }));
        // Apply search filter
        let filtered = tasksWithAssignees;
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = tasksWithAssignees.filter((t) => t.title?.toLowerCase().includes(search));
        }
        // Apply priority filter
        if (filters?.priority && filters.priority !== "All") {
            const priorityMap = {
                Urgent: "URGENT",
                High: "HIGH",
                Medium: "MEDIUM",
                Low: "LOW",
            };
            const dbPriority = priorityMap[filters.priority];
            filtered = tasksWithAssignees.filter((t) => t.priority === filters.priority);
        }
        // Group by team and status
        const board = {};
        filtered.forEach((task) => {
            const teamName = task.teamName || "No Team";
            const status = task.status;
            if (!board[teamName])
                board[teamName] = {};
            if (!board[teamName][status])
                board[teamName][status] = [];
            board[teamName][status].push(task);
        });
        return board;
    }
    /**
     * Move task to new status (drag & drop)
     */
    async moveTask(taskId, newStatus, userId, workspaceId) {
        const [task] = await drizzle_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId))
            .limit(1);
        if (!task)
            throw new Error("Task not found");
        const statusMap = {
            Todo: "TODO",
            "In progress": "IN_PROGRESS",
            "On Hold": "ON_HOLD",
            Done: "DONE",
            Review: "REVIEW",
            Cancelled: "CANCELLED",
        };
        const dbStatus = statusMap[newStatus] || newStatus.toUpperCase();
        const oldStatus = this.formatStatus(task.status || "TODO");
        await drizzle_1.db
            .update(schema_1.tasks)
            .set({ status: dbStatus })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId));
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
    getKanbanTaskFilter(userId, userPermissions, userTeamId) {
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
            REVIEW: "Review",
            DONE: "Done",
            CANCELLED: "Cancelled",
            ON_HOLD: "On Hold",
        };
        return statusMap[status] || status.replace("_", " ");
    }
}
exports.KanbanService = KanbanService;
