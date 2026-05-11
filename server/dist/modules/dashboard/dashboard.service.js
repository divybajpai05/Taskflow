"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class DashboardService {
    /**
     * Get dashboard overview stats for a workspace
     * Filtered by user permissions
     */
    async getOverviewStats(workspaceId, userId, userPermissions, userTeamId) {
        const taskFilter = this.getTaskFilter(workspaceId, userId, userPermissions, userTeamId);
        const peopleFilter = this.getPeopleFilter(workspaceId, userId, userPermissions, userTeamId);
        const [totalTasks] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...taskFilter));
        const taskStatuses = await drizzle_1.db
            .select({ status: schema_1.tasks.status, count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...taskFilter))
            .groupBy(schema_1.tasks.status);
        const taskPriorities = await drizzle_1.db
            .select({ priority: schema_1.tasks.priority, count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...taskFilter))
            .groupBy(schema_1.tasks.priority);
        const departmentHeadcount = await drizzle_1.db
            .select({ team: schema_1.teams.name, count: (0, drizzle_orm_1.count)() })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), ...peopleFilter))
            .groupBy(schema_1.teams.name);
        const [totalWorkforce] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), ...peopleFilter));
        const priorityOrder = {
            URGENT: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
        };
        let highestPriority = "Medium";
        let highestCount = 0;
        taskPriorities.forEach((p) => {
            const pName = p.priority
                ? p.priority.charAt(0).toUpperCase() + p.priority.slice(1).toLowerCase()
                : "Medium";
            if (p.count > highestCount ||
                (p.count === highestCount &&
                    priorityOrder[p.priority] >
                        priorityOrder[highestPriority.toUpperCase()])) {
                highestCount = p.count;
                highestPriority = pName;
            }
        });
        return {
            totalTasks: totalTasks?.count || 0,
            taskStatuses: taskStatuses.map((s) => ({
                status: s.status ? s.status.replace("_", " ") : "Unknown",
                count: s.count,
            })),
            taskPriorities: taskPriorities.map((p) => ({
                priority: p.priority
                    ? p.priority.charAt(0).toUpperCase() +
                        p.priority.slice(1).toLowerCase()
                    : "Medium",
                count: p.count,
            })),
            departmentHeadcount: departmentHeadcount.map((d) => ({
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
    async getActiveTasks(workspaceId, userId, userPermissions, userTeamId, limit = 5, offset = 0) {
        const filter = this.getTaskFilter(workspaceId, userId, userPermissions, userTeamId);
        // Active statuses: not Done, not Cancelled
        const activeFilter = [
            (0, drizzle_orm_1.ne)(schema_1.tasks.status, "DONE"),
            (0, drizzle_orm_1.ne)(schema_1.tasks.status, "CANCELLED"),
        ];
        // Get total count
        const [totalCount] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.tasks)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...activeFilter, ...filter));
        // Get tasks
        const activeTasks = await drizzle_1.db
            .select({
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            teamName: schema_1.teams.name,
            priority: schema_1.tasks.priority,
            status: schema_1.tasks.status,
            dueDate: schema_1.tasks.dueDate,
            createdBy: schema_1.users.name,
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.tasks.createdById, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...activeFilter, ...filter))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.tasks.createdAt))
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
    async getTeamWorkload(workspaceId, userId, userPermissions, userTeamId) {
        const filter = this.getTaskFilter(workspaceId, userId, userPermissions, userTeamId);
        const allTasks = await drizzle_1.db
            .select({
            teamName: schema_1.teams.name,
            status: schema_1.tasks.status,
            assigneeName: schema_1.users.name,
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), ...filter));
        const teamMap = new Map();
        allTasks.forEach((task) => {
            const teamName = task.teamName || "No Team";
            const memberName = task.assigneeName || "Unassigned";
            if (!teamMap.has(teamName))
                teamMap.set(teamName, new Map());
            const memberMap = teamMap.get(teamName);
            if (!memberMap.has(memberName))
                memberMap.set(memberName, { completed: 0, total: 0 });
            const stats = memberMap.get(memberName);
            stats.total++;
            if (task.status === "DONE")
                stats.completed++;
        });
        const result = [];
        teamMap.forEach((memberMap, teamName) => {
            const members = [];
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
    async getOverdueTasks(workspaceId, userId, userPermissions, userTeamId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const filter = this.getTaskFilter(workspaceId, userId, userPermissions, userTeamId);
        const allTasks = await drizzle_1.db
            .select({
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            teamName: schema_1.teams.name,
            priority: schema_1.tasks.priority,
            status: schema_1.tasks.status,
            dueDate: schema_1.tasks.dueDate,
            assigneeName: schema_1.users.name,
        })
            .from(schema_1.tasks)
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.tasks.teamId, schema_1.teams.id))
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.workspaceId, workspaceId), (0, drizzle_orm_1.ne)(schema_1.tasks.status, "DONE"), (0, drizzle_orm_1.ne)(schema_1.tasks.status, "CANCELLED"), ...filter));
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
    getTaskFilter(_workspaceId, userId, userPermissions, userTeamId) {
        const canManageAll = userPermissions.includes("user_management");
        const canManageTeam = userPermissions.includes("team_management");
        if (canManageAll) {
            return [];
        }
        if (canManageTeam && userTeamId) {
            return [(0, drizzle_orm_1.eq)(schema_1.tasks.teamId, userTeamId)];
        }
        const filters = [];
        if (userTeamId) {
            filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.teamId, userTeamId));
        }
        filters.push((0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId));
        return [(0, drizzle_orm_1.or)(...filters)];
    }
    getPeopleFilter(_workspaceId, userId, userPermissions, userTeamId) {
        const canManageAll = userPermissions.includes("user_management");
        if (canManageAll) {
            return [];
        }
        if (userTeamId) {
            return [(0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, userTeamId)];
        }
        return [(0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId)];
    }
    async getLiveActivity(workspaceId, userId, userPermissions, userTeamId, limit = 10) {
        const canManageAll = userPermissions.includes("user_management");
        const canManageTeam = userPermissions.includes("team_management");
        let teamMemberIds = [];
        if (!canManageAll) {
            if (canManageTeam && userTeamId) {
                // Manager: Get all members of their team
                const teamMembers = await drizzle_1.db
                    .select({ userId: schema_1.workspaceMembers.userId })
                    .from(schema_1.workspaceMembers)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, userTeamId)));
                teamMemberIds = teamMembers.map((m) => m.userId);
            }
            else if (userTeamId) {
                // Regular employee: Get team members
                const teamMembers = await drizzle_1.db
                    .select({ userId: schema_1.workspaceMembers.userId })
                    .from(schema_1.workspaceMembers)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, userTeamId)));
                teamMemberIds = teamMembers.map((m) => m.userId);
            }
            else {
                // No team: Only own activity
                teamMemberIds = [userId];
            }
        }
        // Build filter
        const activityFilter = [];
        activityFilter.push((0, drizzle_orm_1.eq)(schema_1.activityLogs.workspaceId, workspaceId));
        if (!canManageAll && teamMemberIds.length > 0) {
            activityFilter.push((0, drizzle_orm_1.inArray)(schema_1.activityLogs.userId, teamMemberIds));
        }
        // ✅ Get total count FIRST (before limit)
        const [totalResult] = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.activityLogs)
            .where((0, drizzle_orm_1.and)(...activityFilter));
        const totalCount = totalResult?.count || 0;
        // Get activities with limit
        const activities = await drizzle_1.db
            .select({
            id: schema_1.activityLogs.id,
            userId: schema_1.activityLogs.userId,
            action: schema_1.activityLogs.action,
            entityType: schema_1.activityLogs.entityType,
            entityId: schema_1.activityLogs.entityId,
            details: schema_1.activityLogs.details,
            createdAt: schema_1.activityLogs.createdAt,
        })
            .from(schema_1.activityLogs)
            .where((0, drizzle_orm_1.and)(...activityFilter))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.createdAt))
            .limit(limit);
        // Get user names and entity names
        const activitiesWithDetails = await Promise.all(activities.map(async (activity) => {
            // Get actor name
            const [actor] = await drizzle_1.db
                .select({ name: schema_1.users.name })
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, activity.userId))
                .limit(1);
            // Get target entity name based on type
            let targetName = "";
            if (activity.entityType === "task" && activity.entityId) {
                const [task] = await drizzle_1.db
                    .select({ title: schema_1.tasks.title })
                    .from(schema_1.tasks)
                    .where((0, drizzle_orm_1.eq)(schema_1.tasks.id, activity.entityId))
                    .limit(1);
                targetName = task?.title || "a task";
            }
            else if (activity.entityType === "user" && activity.entityId) {
                const [user] = await drizzle_1.db
                    .select({ name: schema_1.users.name })
                    .from(schema_1.users)
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, activity.entityId))
                    .limit(1);
                targetName = user?.name || "a user";
            }
            else if (activity.entityType === "team" && activity.entityId) {
                const [team] = await drizzle_1.db
                    .select({ name: schema_1.teams.name })
                    .from(schema_1.teams)
                    .where((0, drizzle_orm_1.eq)(schema_1.teams.id, activity.entityId))
                    .limit(1);
                targetName = team?.name || "a team";
            }
            else if (activity.entityType === "role" && activity.entityId) {
                const [role] = await drizzle_1.db
                    .select({ name: schema_1.roles.name })
                    .from(schema_1.roles)
                    .where((0, drizzle_orm_1.eq)(schema_1.roles.id, activity.entityId))
                    .limit(1);
                targetName = role?.name || "a role";
            }
            else if (activity.entityType === "workspace") {
                targetName = "workspace";
            }
            else if (activity.entityType === "leave") {
                targetName = "leave";
            }
            else if (activity.entityType === "attendance") {
                targetName = "attendance";
            }
            else {
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
        }));
        // ✅ Return both activities and total count
        return {
            activities: activitiesWithDetails,
            total: totalCount,
        };
    }
    formatAction(action) {
        if (action && action.includes(" ")) {
            return action;
        }
        const actionMap = {
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
exports.DashboardService = DashboardService;
