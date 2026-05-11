"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
// src/modules/activity/activity.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
class ActivityService {
    /**
     * Get activity logs for a workspace with filters
     */
    async getActivityLogs(workspaceId, filters = {}) {
        const { search, eventType, dateFrom, dateTo, limit = 50, offset = 0, } = filters;
        // Build where conditions
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.activityLogs.workspaceId, workspaceId)];
        // Filter by event type
        if (eventType && eventType !== "all") {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.activityLogs.action, eventType));
        }
        // Filter by date range
        if (dateFrom) {
            conditions.push((0, drizzle_orm_1.gte)(schema_1.activityLogs.createdAt, new Date(dateFrom)));
        }
        if (dateTo) {
            conditions.push((0, drizzle_orm_1.lte)(schema_1.activityLogs.createdAt, new Date(dateTo)));
        }
        // Get logs with user info
        const logs = await drizzle_1.db
            .select({
            id: schema_1.activityLogs.id,
            timestamp: schema_1.activityLogs.createdAt,
            userId: schema_1.activityLogs.userId,
            userName: schema_1.users.name,
            userEmail: schema_1.users.email,
            action: schema_1.activityLogs.action,
            entityType: schema_1.activityLogs.entityType,
            entityId: schema_1.activityLogs.entityId,
            details: schema_1.activityLogs.details,
            ipAddress: schema_1.activityLogs.ipAddress,
        })
            .from(schema_1.activityLogs)
            .leftJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.activityLogs.userId, schema_1.users.id))
            .where((0, drizzle_orm_1.and)(...conditions))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.activityLogs.createdAt))
            .limit(limit)
            .offset(offset);
        // Apply search filter in memory (since details is JSON)
        let filteredLogs = logs;
        if (search) {
            const searchLower = search.toLowerCase();
            filteredLogs = logs.filter((log) => {
                const userName = (log.userName || "").toLowerCase();
                const userEmail = (log.userEmail || "").toLowerCase();
                const action = (log.action || "").toLowerCase();
                const detailsStr = JSON.stringify(log.details || {}).toLowerCase();
                return (userName.includes(searchLower) ||
                    userEmail.includes(searchLower) ||
                    action.includes(searchLower) ||
                    detailsStr.includes(searchLower));
            });
        }
        // Transform to frontend format
        return filteredLogs.map((log) => ({
            id: String(log.id),
            timestamp: log.timestamp
                ? new Date(log.timestamp).toISOString()
                : new Date().toISOString(),
            user: log.userName || "Unknown User",
            userEmail: log.userEmail || "",
            eventType: this.getEventType(log.action),
            action: this.formatAction(log.action),
            details: this.formatDetails(log),
            taskTitle: log.details?.taskTitle || undefined,
            ipAddress: log.ipAddress || "N/A",
        }));
    }
    /**
     * Log a new activity
     */
    async logActivity(data) {
        await drizzle_1.db.insert(schema_1.activityLogs).values({
            userId: data.userId,
            workspaceId: data.workspaceId,
            action: data.action,
            entityType: data.entityType || "system",
            entityId: data.entityId || null,
            details: data.details || {},
            ipAddress: data.ipAddress || null,
        });
        return { success: true };
    }
    /**
     * Get total count for pagination
     */
    async getActivityCount(workspaceId, filters = {}) {
        const { eventType, dateFrom, dateTo } = filters;
        const conditions = [(0, drizzle_orm_1.eq)(schema_1.activityLogs.workspaceId, workspaceId)];
        if (eventType && eventType !== "all") {
            conditions.push((0, drizzle_orm_1.eq)(schema_1.activityLogs.action, eventType));
        }
        if (dateFrom) {
            conditions.push((0, drizzle_orm_1.gte)(schema_1.activityLogs.createdAt, new Date(dateFrom)));
        }
        if (dateTo) {
            conditions.push((0, drizzle_orm_1.lte)(schema_1.activityLogs.createdAt, new Date(dateTo)));
        }
        const result = await drizzle_1.db
            .select({ count: (0, drizzle_orm_1.count)() })
            .from(schema_1.activityLogs)
            .where((0, drizzle_orm_1.and)(...conditions));
        return result[0]?.count || 0;
    }
    // ==================== HELPERS ====================
    getEventType(action) {
        if (action?.includes("login") || action?.includes("logout"))
            return "login";
        if (action?.includes("task"))
            return "task";
        if (action?.includes("delete") || action?.includes("deleted"))
            return "delete";
        if (action?.includes("create") ||
            action?.includes("created") ||
            action?.includes("register"))
            return "create";
        if (action?.includes("update") ||
            action?.includes("updated") ||
            action?.includes("change"))
            return "update";
        if (action?.includes("verify") || action?.includes("verified"))
            return "verify";
        return "other";
    }
    /**
     * Get distinct event types (actions) for a workspace
     */
    async getEventTypes(workspaceId) {
        const result = await drizzle_1.db
            .selectDistinct({ action: schema_1.activityLogs.action })
            .from(schema_1.activityLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.activityLogs.workspaceId, workspaceId))
            .orderBy(schema_1.activityLogs.action);
        return result.map((r) => ({
            value: r.action,
            label: this.formatAction(r.action),
        }));
    }
    formatAction(action) {
        const actionMap = {
            user_login: "User Login",
            user_logout: "User Logout",
            user_registered: "User Registered",
            email_verified: "Email Verified",
            task_created: "Task Created",
            task_updated: "Task Updated",
            task_deleted: "Task Deleted",
            task_status_changed: "Task Status Changed",
            user_created: "User Created",
            user_updated: "User Updated",
            user_deleted: "User Deleted",
            role_created: "Role Created",
            role_updated: "Role Updated",
            role_deleted: "Role Deleted",
            workspace_created: "Workspace Created",
            permission_changed: "Permission Changed",
        };
        return (actionMap[action] ||
            action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()));
    }
    formatDetails(log) {
        const action = log.action;
        const details = log.details || {};
        switch (action) {
            case "user_login":
                return details.browser || details.source || "Successful login";
            case "task_status_changed":
                return `${details.oldStatus || "?"} → ${details.newStatus || "?"}`;
            case "task_created":
                return "New task added";
            case "task_deleted":
                return "Task permanently removed";
            case "user_registered":
                return `Workspace "${details.workspaceName || "?"}" created`;
            case "email_verified":
                return "Email verification completed";
            default:
                return details.description || details.message || "Activity recorded";
        }
    }
}
exports.ActivityService = ActivityService;
