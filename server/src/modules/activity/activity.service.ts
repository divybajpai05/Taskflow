// src/modules/activity/activity.service.ts
import { db } from "../../db/drizzle";
import { activityLogs, users } from "../../db/schema";
import { eq, and, like, or, desc, gte, lte, count } from "drizzle-orm";

export interface ActivityFilters {
  search?: string;
  eventType?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

export class ActivityService {
  /**
   * Get activity logs for a workspace with filters
   */
  async getActivityLogs(workspaceId: string, filters: ActivityFilters = {}) {
    const {
      search,
      eventType,
      dateFrom,
      dateTo,
      limit = 50,
      offset = 0,
    } = filters;

    // Build where conditions
    const conditions = [eq(activityLogs.workspaceId, workspaceId)];

    // Filter by event type
    if (eventType && eventType !== "all") {
      conditions.push(eq(activityLogs.action, eventType));
    }

    // Filter by date range
    if (dateFrom) {
      conditions.push(gte(activityLogs.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(activityLogs.createdAt, new Date(dateTo)));
    }

    // Get logs with user info
    const logs = await db
      .select({
        id: activityLogs.id,
        timestamp: activityLogs.createdAt,
        userId: activityLogs.userId,
        userName: users.name,
        userEmail: users.email,
        action: activityLogs.action,
        entityType: activityLogs.entityType,
        entityId: activityLogs.entityId,
        details: activityLogs.details,
        ipAddress: activityLogs.ipAddress,
      })
      .from(activityLogs)
      .leftJoin(users, eq(activityLogs.userId, users.id))
      .where(and(...conditions))
      .orderBy(desc(activityLogs.createdAt))
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

        return (
          userName.includes(searchLower) ||
          userEmail.includes(searchLower) ||
          action.includes(searchLower) ||
          detailsStr.includes(searchLower)
        );
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
      taskTitle: (log.details as any)?.taskTitle || undefined,
      ipAddress: log.ipAddress || "N/A",
    }));
  }

  /**
   * Log a new activity
   */
  async logActivity(data: {
    userId: string;
    workspaceId: string;
    action: string;
    entityType?: string;
    entityId?: string;
    details?: any;
    ipAddress?: string;
  }) {
    await db.insert(activityLogs).values({
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
  async getActivityCount(workspaceId: string, filters: ActivityFilters = {}) {
    const { eventType, dateFrom, dateTo } = filters;

    const conditions = [eq(activityLogs.workspaceId, workspaceId)];

    if (eventType && eventType !== "all") {
      conditions.push(eq(activityLogs.action, eventType));
    }

    if (dateFrom) {
      conditions.push(gte(activityLogs.createdAt, new Date(dateFrom)));
    }
    if (dateTo) {
      conditions.push(lte(activityLogs.createdAt, new Date(dateTo)));
    }

    const result = await db
      .select({ count: count() })
      .from(activityLogs)
      .where(and(...conditions));

    return result[0]?.count || 0;
  }

  // ==================== HELPERS ====================

  private getEventType(action: string): string {
    if (action?.includes("login") || action?.includes("logout")) return "login";
    if (action?.includes("task")) return "task";
    if (action?.includes("delete") || action?.includes("deleted"))
      return "delete";
    if (
      action?.includes("create") ||
      action?.includes("created") ||
      action?.includes("register")
    )
      return "create";
    if (
      action?.includes("update") ||
      action?.includes("updated") ||
      action?.includes("change")
    )
      return "update";
    if (action?.includes("verify") || action?.includes("verified"))
      return "verify";
    return "other";
  }

  /**
   * Get distinct event types (actions) for a workspace
   */
  async getEventTypes(workspaceId: string) {
    const result = await db
      .selectDistinct({ action: activityLogs.action })
      .from(activityLogs)
      .where(eq(activityLogs.workspaceId, workspaceId))
      .orderBy(activityLogs.action);

    return result.map((r) => ({
      value: r.action,
      label: this.formatAction(r.action),
    }));
  }

  private formatAction(action: string): string {
    const actionMap: Record<string, string> = {
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

    return (
      actionMap[action] ||
      action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    );
  }

  private formatDetails(log: any): string {
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
