// src/modules/workspaces/workspace.service.ts
import { db } from "../../db/drizzle";
import {
  workspaces,
  users,
  roles,
  activityLogs,
  attendance,
  leaves,
  tasks,
  teams,
  workspaceMembers,
  userPermissions,
  emailLogs,
} from "../../db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { ActivityService } from "../activity/activity.service";

const activityService = new ActivityService();

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
}

export class WorkspaceService {
  /**
   * Get all workspaces owned by a user
   */
  async getUserWorkspaces(userId: string) {
    // FIXED: Get workspaces from workspace_members instead of ownerId
    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .where(eq(workspaceMembers.userId, userId))
      .orderBy(desc(workspaces.createdAt));

    const workspacesWithStats = await Promise.all(
      userWorkspaces.map(async (ws) => {
        const [memberCount] = await db
          .select({ count: count() })
          .from(workspaceMembers)
          .where(eq(workspaceMembers.workspaceId, ws.id));

        return {
          ...ws,
          memberCount: memberCount?.count || 0,
          taskCount: 0,
          isActive: true,
        };
      }),
    );

    return workspacesWithStats;
  }

  /**
   * Get a single workspace by ID
   */
  async getWorkspaceById(workspaceId: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    return workspace;
  }

  /**
   * Create a new workspace for an existing user (owner)
   */
  async createWorkspace(input: CreateWorkspaceInput, ownerId: string) {
    const { name, description } = input;

    // Check if workspace name already exists for this owner
    const [existingWorkspace] = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.name, name), eq(workspaces.ownerId, ownerId)))
      .limit(1);

    if (existingWorkspace) {
      throw new Error("You already have a workspace with this name");
    }

    const workspaceId = uuidv4();

    // Create workspace
    await db.insert(workspaces).values({
      id: workspaceId,
      name,
      description: description || `${name} workspace`,
      ownerId,
    });

    // Add owner as Admin member
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Admin"))
      .limit(1);

    if (adminRole) {
      await db.insert(workspaceMembers).values({
        id: uuidv4(),
        userId: ownerId,
        workspaceId: workspaceId,
        roleId: adminRole.id,
        teamId: null,
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
  async updateWorkspace(
    workspaceId: string,
    input: UpdateWorkspaceInput,
    userId: string,
  ) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Only owner can update
    if (workspace.ownerId !== userId) {
      throw new Error("Only the workspace owner can update it");
    }

    const updateData: any = {};
    if (input.name) updateData.name = input.name;
    if (input.description !== undefined)
      updateData.description = input.description;

    await db
      .update(workspaces)
      .set(updateData)
      .where(eq(workspaces.id, workspaceId));

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
  async deleteWorkspace(workspaceId: string, userId: string) {
    const [workspace] = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);

    if (!workspace) throw new Error("Workspace not found");
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

    // 1. Delete attendance (references workspaceId)
    await db.delete(attendance).where(eq(attendance.workspaceId, workspaceId));

    // 2. Delete leaves (references workspaceId)
    await db.delete(leaves).where(eq(leaves.workspaceId, workspaceId));

    // 3. Delete activity logs (references workspaceId)
    await db
      .delete(activityLogs)
      .where(eq(activityLogs.workspaceId, workspaceId));

    // 4. Delete tasks (references workspaceId)
    await db.delete(tasks).where(eq(tasks.workspaceId, workspaceId));

    // 5. Delete email logs (references workspaceId)
    await db.delete(emailLogs).where(eq(emailLogs.workspaceId, workspaceId));

    // 6. Delete workspace members (references workspaceId)
    // FIXED: Get user IDs that will be orphaned
    const membersToDelete = await db
      .select({ userId: workspaceMembers.userId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    // 7. Delete user permission overrides for users in this workspace
    const userIds = membersToDelete.map((m) => m.userId);
    if (userIds.length > 0) {
      // Only delete user_permissions for users who don't have other workspace memberships
      for (const uid of userIds) {
        const [otherMembership] = await db
          .select()
          .from(workspaceMembers)
          .where(eq(workspaceMembers.userId, uid))
          .limit(1);

        if (!otherMembership) {
          await db
            .delete(userPermissions)
            .where(eq(userPermissions.userId, uid));
          // Delete user if no other workspace memberships
          await db.delete(users).where(eq(users.id, uid));
        }
      }
    }

    // 8. Delete teams (references workspaceId)
    await db.delete(teams).where(eq(teams.workspaceId, workspaceId));

    // 9. Delete workspace
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

    return { success: true, message: "Workspace deleted" };
  }
}
