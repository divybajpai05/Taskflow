"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskService = void 0;
// src/modules/tasks/task.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const email_service_1 = require("../auth/email.service");
const activity_service_1 = require("../activity/activity.service");
const brevoEmailService = new email_service_1.EmailService();
const activityService = new activity_service_1.ActivityService();
class TaskService {
    /**
     * Get all tasks in a workspace with filters
     */
    async getTasks(workspaceId, userId, userPermissions, userTeamId, filters) {
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId)];
        console.log("🔵 getTasks - User:", userId);
        console.log("🔵 getTasks - Permissions:", userPermissions);
        console.log("🔵 getTasks - TeamId:", userTeamId);
        const canSeeAllTasks = userPermissions.includes("team_management") ||
            userPermissions.includes("user_management") ||
            userPermissions.includes("admin");
        console.log("🔵 getTasks - canSeeAllTasks:", canSeeAllTasks);
        if (!canSeeAllTasks) {
            console.log("🔵 getTasks - Applying team filter...");
            if (userTeamId) {
                const assignedTaskIds = await drizzle_1.db
                    .select({ taskId: schema_1.taskAssignees.taskId })
                    .from(schema_1.taskAssignees)
                    .where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, userId));
                const assignedIds = assignedTaskIds.map((a) => a.taskId);
                if (assignedIds.length > 0) {
                    conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.tasks.teamId, userTeamId), (0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, assignedIds)));
                }
                else {
                    conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.tasks.teamId, userTeamId), (0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId)));
                }
            }
            else {
                const assignedTaskIds = await drizzle_1.db
                    .select({ taskId: schema_1.taskAssignees.taskId })
                    .from(schema_1.taskAssignees)
                    .where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, userId));
                const assignedIds = assignedTaskIds.map((a) => a.taskId);
                if (assignedIds.length > 0) {
                    conditions.push((0, drizzle_orm_1.or)((0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId), (0, drizzle_orm_1.inArray)(schema_1.tasks.id, assignedIds)));
                }
                else {
                    conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId));
                }
            }
        }
        if (filters?.teamId && filters.teamId !== "All") {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.teamId, filters.teamId));
        }
        if (filters?.status && filters.status !== "All") {
            const statusMap = {
                Todo: "TODO",
                "In progress": "IN_PROGRESS",
                Done: "DONE",
                "On Hold": "ON_HOLD",
                Cancelled: "CANCELLED",
            };
            conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.status, statusMap[filters.status]));
        }
        if (filters?.priority && filters.priority !== "All") {
            const priorityMap = {
                Urgent: "URGENT",
                High: "HIGH",
                Medium: "MEDIUM",
                Low: "LOW",
            };
            conditions.push((0, drizzle_orm_1.eq)(schema_1.tasks.priority, priorityMap[filters.priority]));
        }
        const taskList = await drizzle_1.db
            .select({
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            description: schema_1.tasks.description,
            priority: schema_1.tasks.priority,
            status: schema_1.tasks.status,
            teamId: schema_1.tasks.teamId,
            teamName: schema_1.teams.name,
            assigneeId: schema_1.tasks.assigneeId,
            createdById: schema_1.tasks.createdById,
            creatorName: schema_1.users.name,
            dueDate: schema_1.tasks.dueDate,
            createdAt: schema_1.tasks.createdAt,
            updatedAt: schema_1.tasks.updatedAt,
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.tasks.createdById, schema_1.users.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt));
        let filtered = taskList;
        if (filters?.search) {
            const search = filters.search.toLowerCase();
            filtered = taskList.filter((t) => t.title?.toLowerCase().includes(search) ||
                t.description?.toLowerCase().includes(search));
        }
        const tasksWithAssignees = await Promise.all(filtered.map(async (task) => {
            let assignees = [];
            try {
                assignees = await drizzle_1.db
                    .select({ id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email })
                    .from(schema_1.taskAssignees)
                    .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, schema_1.users.id))
                    .where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.taskId, task.id));
            }
            catch (error) {
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
        }));
        return tasksWithAssignees;
    }
    /**
     * Create a new task
     */
    async createTask(input, workspaceId, createdById, userPermissions) {
        const { title, description, priority, status, teamId, assigneeIds, dueDate, } = input;
        const canManageAll = userPermissions.includes("team_management") ||
            userPermissions.includes("user_management");
        let finalAssigneeIds = assigneeIds;
        let finalTeamId = teamId;
        if (!canManageAll) {
            finalAssigneeIds = [createdById];
            const [memberData] = await drizzle_1.db
                .select({ teamId: schema_1.workspaceMembers.teamId })
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, createdById), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
                .limit(1);
            finalTeamId = memberData?.teamId || teamId;
            console.log("🔵 Regular user creating task - workspace team:", finalTeamId, "forced assignee:", createdById);
        }
        const taskId = (0, uuid_1.v4)();
        const statusMap = {
            Todo: "TODO",
            "In progress": "IN_PROGRESS",
            Done: "DONE",
            "On Hold": "ON_HOLD",
            Cancelled: "CANCELLED",
        };
        const priorityMap = {
            Urgent: "URGENT",
            High: "HIGH",
            Medium: "MEDIUM",
            Low: "LOW",
        };
        let parsedDueDate = null;
        if (dueDate && dueDate.includes("/")) {
            const parts = dueDate.split("/");
            if (parts.length === 3) {
                const [day, month, year] = parts.map(Number);
                parsedDueDate = new Date(2000 + year, month - 1, day);
            }
        }
        await drizzle_1.db.insert(schema_1.tasks).values({
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
            await drizzle_1.db.insert(schema_1.taskAssignees).values(finalAssigneeIds.map((userId) => ({
                taskId: taskId,
                userId: userId,
            })));
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
                const assignees = await drizzle_1.db
                    .select({ id: schema_1.users.id, name: schema_1.users.name, email: schema_1.users.email })
                    .from(schema_1.users)
                    .where((0, drizzle_orm_1.inArray)(schema_1.users.id, finalAssigneeIds));
                const [creator] = await drizzle_1.db
                    .select({ name: schema_1.users.name })
                    .from(schema_1.users)
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, createdById))
                    .limit(1);
                const [workspace] = await drizzle_1.db
                    .select({ name: schema_1.workspaces.name })
                    .from(schema_1.workspaces)
                    .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId))
                    .limit(1);
                for (const assignee of assignees) {
                    await brevoEmailService.sendTaskAssignmentEmail(assignee.email, assignee.name, title, description || "", creator?.name || "A team member", dueDate || "Not set", workspace?.name || "Your Workspace");
                }
                console.log(`✅ Task assignment emails sent to ${assignees.length} user(s)`);
            }
            catch (error) {
                console.error("Failed to send task assignment emails:", error);
            }
        }
        return { success: true, taskId };
    }
    /**
     * Update a task
     */
    async updateTask(taskId, input, userId, userPermissions, workspaceId) {
        const [task] = await drizzle_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId))
            .limit(1);
        if (!task)
            throw new Error("Task not found");
        const canManageAll = userPermissions.includes("team_management") ||
            userPermissions.includes("user_management");
        const isCreator = task.createdById === userId;
        const [assignee] = await drizzle_1.db
            .select()
            .from(schema_1.taskAssignees)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.taskAssignees.taskId, taskId), (0, drizzle_orm_1.eq)(schema_1.taskAssignees.userId, userId)))
            .limit(1);
        const isAssignee = !!assignee;
        const canEdit = canManageAll || isCreator || isAssignee;
        if (!canEdit) {
            throw new Error("You don't have permission to edit this task");
        }
        if (input.assigneeIds && !canManageAll) {
            input.assigneeIds = [userId];
        }
        const statusMap = {
            Todo: "TODO",
            "In progress": "IN_PROGRESS",
            Done: "DONE",
            "On Hold": "ON_HOLD",
            Cancelled: "CANCELLED",
        };
        const priorityMap = {
            Urgent: "URGENT",
            High: "HIGH",
            Medium: "MEDIUM",
            Low: "LOW",
        };
        const updateData = {};
        if (input.title)
            updateData.title = input.title;
        if (input.description !== undefined)
            updateData.description = input.description;
        if (input.priority) {
            updateData.priority =
                priorityMap[input.priority] || input.priority.toUpperCase();
        }
        // ✅ Track if status is changing
        const statusChanged = input.status && statusMap[input.status] !== task.status;
        if (input.status) {
            updateData.status = statusMap[input.status] || input.status.toUpperCase();
        }
        if (input.teamId !== undefined) {
            if (!canManageAll) {
                const [memberData] = await drizzle_1.db
                    .select({ teamId: schema_1.workspaceMembers.teamId })
                    .from(schema_1.workspaceMembers)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, task.workspaceId)))
                    .limit(1);
                updateData.teamId = memberData?.teamId || input.teamId;
            }
            else {
                updateData.teamId = input.teamId;
            }
        }
        if (input.assigneeIds !== undefined && canManageAll) {
            await drizzle_1.db.delete(schema_1.taskAssignees).where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.taskId, taskId));
            if (input.assigneeIds.length > 0) {
                await drizzle_1.db
                    .insert(schema_1.taskAssignees)
                    .values(input.assigneeIds.map((userId) => ({ taskId, userId })));
                updateData.assigneeId = input.assigneeIds[0];
            }
            else {
                updateData.assigneeId = null;
            }
        }
        if (input.dueDate && input.dueDate.includes("/")) {
            const parts = input.dueDate.split("/");
            if (parts.length === 3) {
                const [day, month, year] = parts.map(Number);
                updateData.dueDate = new Date(2000 + year, month - 1, day);
            }
        }
        else if (input.dueDate) {
            updateData.dueDate = new Date(input.dueDate);
        }
        await drizzle_1.db.update(schema_1.tasks).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId));
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
        }
        else {
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
    async deleteTask(taskId, userId, userPermissions, workspaceId) {
        const [task] = await drizzle_1.db
            .select()
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId))
            .limit(1);
        if (!task)
            throw new Error("Task not found");
        const canManageAll = userPermissions.includes("team_management") ||
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
        await drizzle_1.db.delete(schema_1.taskAssignees).where((0, drizzle_orm_1.eq)(schema_1.taskAssignees.taskId, taskId));
        // Delete the task
        await drizzle_1.db.delete(schema_1.tasks).where((0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId));
        return { success: true };
    }
    /**
     * Get teams for a workspace (for dropdown)
     */
    async getTeams(workspaceId) {
        return drizzle_1.db
            .select({ id: schema_1.teams.id, name: schema_1.teams.name })
            .from(schema_1.teams)
            .where((0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId));
    }
}
exports.TaskService = TaskService;
