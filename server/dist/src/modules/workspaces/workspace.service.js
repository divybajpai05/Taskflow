"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceService = void 0;
// src/modules/workspaces/workspace.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const activity_service_1 = require("../activity/activity.service");
const activityService = new activity_service_1.ActivityService();
class WorkspaceService {
    /**
     * Get all workspaces owned by a user
     */
    async getUserWorkspaces(userId) {
        const userWorkspaces = await drizzle_1.db
            .select({
            id: schema_1.workspaces.id,
            name: schema_1.workspaces.name,
            description: schema_1.workspaces.description,
            ownerId: schema_1.workspaces.ownerId,
            createdAt: schema_1.workspaces.createdAt,
            updatedAt: schema_1.workspaces.updatedAt,
        })
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.ownerId, userId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.workspaces.createdAt));
        const workspacesWithStats = await Promise.all(userWorkspaces.map(async (ws) => {
            // ✅ Count members from workspace_members
            const [memberCount] = await drizzle_1.db
                .select({ count: (0, drizzle_orm_1.count)() })
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, ws.id));
            return {
                ...ws,
                memberCount: memberCount?.count || 0,
                taskCount: 0,
                isActive: true,
            };
        }));
        return workspacesWithStats;
    }
    /**
     * Get a single workspace by ID
     */
    async getWorkspaceById(workspaceId) {
        const [workspace] = await drizzle_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId))
            .limit(1);
        if (!workspace) {
            throw new Error("Workspace not found");
        }
        return workspace;
    }
    /**
     * Create a new workspace for an existing user (owner)
     */
    async createWorkspace(input, ownerId) {
        const { name, description } = input;
        // Check if workspace name already exists for this owner
        const existingWorkspace = await drizzle_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaces.name, name), (0, drizzle_orm_1.eq)(schema_1.workspaces.ownerId, ownerId)))
            .limit(1);
        if (existingWorkspace.length > 0) {
            throw new Error("You already have a workspace with this name");
        }
        const workspaceId = (0, uuid_1.v4)();
        // Create workspace
        await drizzle_1.db.insert(schema_1.workspaces).values({
            id: workspaceId,
            name,
            description: description || `${name} workspace`,
            ownerId,
        });
        // ✅ Add owner as Admin member
        const [adminRole] = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.name, "Admin"))
            .limit(1);
        if (adminRole) {
            await drizzle_1.db.insert(schema_1.workspaceMembers).values({
                userId: ownerId,
                workspaceId: workspaceId,
                roleId: adminRole.id,
            });
        }
        // Log activity
        await activityService.logActivity({
            userId: ownerId,
            workspaceId: workspaceId,
            action: `created workspace "${name}"`,
            entityType: "workspace",
            entityId: workspaceId,
            details: { workspaceName: name },
        });
        return this.getWorkspaceById(workspaceId);
    }
    /**
     * Update workspace details
     */
    async updateWorkspace(workspaceId, input, userId) {
        const [workspace] = await drizzle_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId))
            .limit(1);
        if (!workspace) {
            throw new Error("Workspace not found");
        }
        // Only owner can update
        if (workspace.ownerId !== userId) {
            throw new Error("Only the workspace owner can update it");
        }
        const updateData = {};
        if (input.name)
            updateData.name = input.name;
        if (input.description !== undefined)
            updateData.description = input.description;
        await drizzle_1.db
            .update(schema_1.workspaces)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId));
        // Log activity
        await activityService.logActivity({
            userId: userId,
            workspaceId: workspaceId,
            action: `updated workspace settings`,
            entityType: "workspace",
            entityId: workspaceId,
            details: { changes: input },
        });
        return this.getWorkspaceById(workspaceId);
    }
    /**
     * Delete workspace (only owner can delete)
     */
    async deleteWorkspace(workspaceId, userId) {
        const [workspace] = await drizzle_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId))
            .limit(1);
        if (!workspace)
            throw new Error("Workspace not found");
        if (workspace.ownerId !== userId)
            throw new Error("Only the workspace owner can delete it");
        await activityService.logActivity({
            userId,
            workspaceId,
            action: `deleted workspace "${workspace.name}"`,
            entityType: "workspace",
            entityId: workspaceId,
            details: { workspaceName: workspace.name },
        });
        // ✅ 1. Clear team_id for ALL users referencing teams in this workspace
        await drizzle_1.db.execute(`
    UPDATE users u 
    JOIN teams t ON u.team_id = t.id 
    SET u.team_id = NULL, u.team = NULL 
    WHERE t.workspace_id = '${workspaceId}'
  `);
        console.log("🔵 Cleared team references globally");
        // 2. Delete attendance
        await drizzle_1.db.delete(schema_1.attendance).where((0, drizzle_orm_1.eq)(schema_1.attendance.workspaceId, workspaceId));
        // 3. Delete leaves (for users in this workspace)
        await drizzle_1.db.execute(`DELETE l FROM leaves l JOIN users u ON l.user_id = u.id WHERE u.workspace_id = '${workspaceId}'`);
        // 4. Delete activity logs
        await drizzle_1.db
            .delete(schema_1.activityLogs)
            .where((0, drizzle_orm_1.eq)(schema_1.activityLogs.workspaceId, workspaceId));
        // 5. Delete user permission overrides
        await drizzle_1.db.execute(`DELETE up FROM user_permissions up JOIN users u ON up.user_id = u.id WHERE u.workspace_id = '${workspaceId}'`);
        // 6. Delete workspace members
        await drizzle_1.db
            .delete(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId));
        // 7. Delete email logs
        await drizzle_1.db.delete(schema_1.emailLogs).where((0, drizzle_orm_1.eq)(schema_1.emailLogs.workspaceId, workspaceId));
        // 8. Delete users
        await drizzle_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.workspaceId, workspaceId));
        // 9. Delete teams (now safe - no users reference them)
        await drizzle_1.db.delete(schema_1.teams).where((0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId));
        console.log("🔵 Teams deleted");
        // 10. Delete workspace
        await drizzle_1.db.delete(schema_1.workspaces).where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId));
        return { success: true, message: "Workspace deleted" };
    }
}
exports.WorkspaceService = WorkspaceService;
