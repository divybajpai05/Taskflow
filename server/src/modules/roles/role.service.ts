// src/modules/roles/role.service.ts
import { db } from "../../db/drizzle";
import {
  roles,
  permissions,
  rolePermissions,
  workspaceMembers,
  users,
  userPermissions,
} from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { ActivityService } from "../activity/activity.service";

export interface CreateRoleInput {
  name: string;
  description?: string;
  permissions: string[]; // Array of permission IDs
}

export interface UpdateRoleInput {
  name?: string;
  description?: string;
  permissions?: string[]; // Array of permission IDs
}

const activityService = new ActivityService();

export class RoleService {
  /**
   * Get all roles with their permissions
   */
  async getAllRoles() {
    const roleList = await db.select().from(roles);

    // Get permissions for each role
    const rolesWithPermissions = await Promise.all(
      roleList.map(async (role) => {
        const perms = await db
          .select({
            id: permissions.id,
            name: permissions.name,
            description: permissions.description,
            module: permissions.module,
          })
          .from(rolePermissions)
          .innerJoin(
            permissions,
            eq(rolePermissions.permissionId, permissions.id),
          )
          .where(eq(rolePermissions.roleId, role.id));

        return {
          ...role,
          permissions: perms,
          permissionsCount: perms.length,
          permissionNames: perms.map((p) => p.name),
        };
      }),
    );

    return rolesWithPermissions;
  }

  /**
   * Get a single role by ID
   */
  async getRoleById(roleId: string) {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      throw new Error("Role not found");
    }

    const perms = await db
      .select({
        id: permissions.id,
        name: permissions.name,
        description: permissions.description,
        module: permissions.module,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, role.id));

    return {
      ...role,
      permissions: perms,
      permissionsCount: perms.length,
      permissionNames: perms.map((p) => p.name),
    };
  }

  /**
   * Create a new custom role
   */
  async createRole(
    input: CreateRoleInput,
    userId: string,
    workspaceId: string,
  ) {
    const { name, description, permissions: permissionIds } = input;

    // Check if role name already exists
    const existingRole = await db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);

    if (existingRole.length > 0) {
      throw new Error("A role with this name already exists");
    }

    // Validate all permission IDs exist
    if (permissionIds.length > 0) {
      // ✅ Use inArray to check if all permission IDs exist
      const existingPerms = await db
        .select()
        .from(permissions)
        .where(inArray(permissions.id, permissionIds));

      if (existingPerms.length !== permissionIds.length) {
        throw new Error("One or more permissions are invalid");
      }
    }

    const roleId = uuidv4();

    // Create role
    await db.insert(roles).values({
      id: roleId,
      name,
      description: description || `${name} role`,
      isSystem: false, // ✅ Custom roles are not system roles
    });

    // Assign permissions
    if (permissionIds.length > 0) {
      await db.insert(rolePermissions).values(
        permissionIds.map((permId) => ({
          roleId,
          permissionId: permId,
        })),
      );
    }

    await activityService.logActivity({
      userId: userId,
      workspaceId: workspaceId,
      action: "role_created",
      entityType: "role",
      entityId: roleId,
      details: { roleName: name, permissionsCount: permissionIds.length },
    });

    return this.getRoleById(roleId);
  }

  /**
   * Update a role
   */
  async updateRole(
    roleId: string,
    input: UpdateRoleInput,
    userId: string,
    workspaceId: string,
  ) {
    const { name, description, permissions: permissionIds } = input;

    // Check if role exists
    const [existingRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!existingRole) {
      throw new Error("Role not found");
    }

    // Prevent modifying system roles (optional - you can remove this if you want to allow editing system roles)
    // if (existingRole.isSystem) {
    //   throw new Error("Cannot modify system roles");
    // }

    // Check name uniqueness if changed
    if (name && name !== existingRole.name) {
      const nameTaken = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);

      if (nameTaken.length > 0) {
        throw new Error("A role with this name already exists");
      }
    }

    // Update role details
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    await db.update(roles).set(updateData).where(eq(roles.id, roleId));

    // Update permissions if provided
    if (permissionIds !== undefined) {
      // Remove existing permissions
      await db
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      // Add new permissions
      if (permissionIds.length > 0) {
        await db.insert(rolePermissions).values(
          permissionIds.map((permId) => ({
            roleId,
            permissionId: permId,
          })),
        );
      }
    }

    await activityService.logActivity({
      userId: userId,
      workspaceId: workspaceId,
      action: "role_updated",
      entityType: "role",
      entityId: roleId,
      details: { roleName: name || existingRole.name },
    });

    return this.getRoleById(roleId);
  }

  /**
   * Delete a role (only non-system roles)
   */
  async deleteRole(roleId: string, userId: string, workspaceId: string) {
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot delete system roles");

    const [fallbackRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Employee"))
      .limit(1);

    if (!fallbackRole) throw new Error("Fallback role not found");

    // Reassign users
    await db
      .update(workspaceMembers)
      .set({ roleId: fallbackRole.id })
      .where(eq(workspaceMembers.roleId, roleId));
    await db
      .update(users)
      .set({ roleId: fallbackRole.id })
      .where(eq(users.roleId, roleId));

    // Delete related records
    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));
    await db
      .delete(userPermissions)
      .where(eq(userPermissions.permissionId, roleId)); // ✅ ADD THIS
    await db.delete(roles).where(eq(roles.id, roleId));

    // Log activity
    await activityService.logActivity({
      userId,
      workspaceId,
      action: "role_deleted",
      entityType: "role",
      entityId: roleId,
      details: { roleName: role.name },
    });

    return { success: true, message: "Role deleted successfully" };
  }

  /**
   * Get all available permissions (for the permission picker)
   */
  async getAllPermissions() {
    return db.select().from(permissions);
  }
}
