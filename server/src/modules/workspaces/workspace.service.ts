// src/modules/workspaces/workspace.service.ts
import { db } from "../../db/drizzle";
import { workspaces, users, roles, activityLogs, attendance, leaves, tasks, teams, workspaceMembers, userPermissions, emailLogs } from "../../db/schema";
import { eq, and, desc, count } from "drizzle-orm";
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
    const userWorkspaces = await db
      .select({
        id: workspaces.id,
        name: workspaces.name,
        description: workspaces.description,
        ownerId: workspaces.ownerId,
        createdAt: workspaces.createdAt,
        updatedAt: workspaces.updatedAt,
      })
      .from(workspaces)
      .where(eq(workspaces.ownerId, userId))
      .orderBy(desc(workspaces.createdAt));

    const workspacesWithStats = await Promise.all(
      userWorkspaces.map(async (ws) => {
        // ✅ Count members from workspace_members
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
    const existingWorkspace = await db
      .select()
      .from(workspaces)
      .where(and(eq(workspaces.name, name), eq(workspaces.ownerId, ownerId)))
      .limit(1);

    if (existingWorkspace.length > 0) {
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

    // ✅ Add owner as Admin member
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Admin"))
      .limit(1);

    if (adminRole) {
      await db.insert(workspaceMembers).values({
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

    // ✅ 1. Clear team_id for ALL users referencing teams in this workspace
    await db.execute(`
    UPDATE users u 
    JOIN teams t ON u.team_id = t.id 
    SET u.team_id = NULL, u.team = NULL 
    WHERE t.workspace_id = '${workspaceId}'
  `);
    console.log("🔵 Cleared team references globally");

    // 2. Delete attendance
    await db.delete(attendance).where(eq(attendance.workspaceId, workspaceId));

    // 3. Delete leaves (for users in this workspace)
    await db.execute(
      `DELETE l FROM leaves l JOIN users u ON l.user_id = u.id WHERE u.workspace_id = '${workspaceId}'`,
    );

    // 4. Delete activity logs
    await db
      .delete(activityLogs)
      .where(eq(activityLogs.workspaceId, workspaceId));

    // 5. Delete user permission overrides
    await db.execute(
      `DELETE up FROM user_permissions up JOIN users u ON up.user_id = u.id WHERE u.workspace_id = '${workspaceId}'`,
    );

    // 6. Delete workspace members
    await db
      .delete(workspaceMembers)
      .where(eq(workspaceMembers.workspaceId, workspaceId));

    // 7. Delete email logs
    await db.delete(emailLogs).where(eq(emailLogs.workspaceId, workspaceId));

    // 8. Delete users
    await db.delete(users).where(eq(users.workspaceId, workspaceId));

    // 9. Delete teams (now safe - no users reference them)
    await db.delete(teams).where(eq(teams.workspaceId, workspaceId));
    console.log("🔵 Teams deleted");

    // 10. Delete workspace
    await db.delete(workspaces).where(eq(workspaces.id, workspaceId));

    return { success: true, message: "Workspace deleted" };
  }
}
