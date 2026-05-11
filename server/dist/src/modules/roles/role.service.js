"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleService = void 0;
// src/modules/roles/role.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const uuid_1 = require("uuid");
const activity_service_1 = require("../activity/activity.service");
const activityService = new activity_service_1.ActivityService();
class RoleService {
    /**
     * Get all roles with their permissions
     */
    async getAllRoles() {
        const roleList = await drizzle_1.db.select().from(schema_1.roles);
        // Get permissions for each role
        const rolesWithPermissions = await Promise.all(roleList.map(async (role) => {
            const perms = await drizzle_1.db
                .select({
                id: schema_1.permissions.id,
                name: schema_1.permissions.name,
                description: schema_1.permissions.description,
                module: schema_1.permissions.module,
            })
                .from(schema_1.rolePermissions)
                .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
                .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, role.id));
            return {
                ...role,
                permissions: perms,
                permissionsCount: perms.length,
                permissionNames: perms.map((p) => p.name),
            };
        }));
        return rolesWithPermissions;
    }
    /**
     * Get a single role by ID
     */
    async getRoleById(roleId) {
        const [role] = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
            .limit(1);
        if (!role) {
            throw new Error("Role not found");
        }
        const perms = await drizzle_1.db
            .select({
            id: schema_1.permissions.id,
            name: schema_1.permissions.name,
            description: schema_1.permissions.description,
            module: schema_1.permissions.module,
        })
            .from(schema_1.rolePermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, role.id));
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
    async createRole(input, userId, workspaceId) {
        const { name, description, permissions: permissionIds } = input;
        // Check if role name already exists
        const existingRole = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.name, name))
            .limit(1);
        if (existingRole.length > 0) {
            throw new Error("A role with this name already exists");
        }
        // Validate all permission IDs exist
        if (permissionIds.length > 0) {
            // ✅ Use inArray to check if all permission IDs exist
            const existingPerms = await drizzle_1.db
                .select()
                .from(schema_1.permissions)
                .where((0, drizzle_orm_1.inArray)(schema_1.permissions.id, permissionIds));
            if (existingPerms.length !== permissionIds.length) {
                throw new Error("One or more permissions are invalid");
            }
        }
        const roleId = (0, uuid_1.v4)();
        // Create role
        await drizzle_1.db.insert(schema_1.roles).values({
            id: roleId,
            name,
            description: description || `${name} role`,
            isSystem: false, // ✅ Custom roles are not system roles
        });
        // Assign permissions
        if (permissionIds.length > 0) {
            await drizzle_1.db.insert(schema_1.rolePermissions).values(permissionIds.map((permId) => ({
                roleId,
                permissionId: permId,
            })));
        }
        await activityService.logActivity({
            userId: userId,
            workspaceId: workspaceId,
            action: `created role "${name}"`,
            entityType: "role",
            entityId: roleId,
            details: { roleName: name, permissionsCount: permissionIds.length },
        });
        return this.getRoleById(roleId);
    }
    /**
     * Update a role
     */
    async updateRole(roleId, input, userId, workspaceId) {
        const { name, description, permissions: permissionIds } = input;
        // Check if role exists
        const [existingRole] = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
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
            const nameTaken = await drizzle_1.db
                .select()
                .from(schema_1.roles)
                .where((0, drizzle_orm_1.eq)(schema_1.roles.name, name))
                .limit(1);
            if (nameTaken.length > 0) {
                throw new Error("A role with this name already exists");
            }
        }
        // Update role details
        const updateData = {};
        if (name)
            updateData.name = name;
        if (description !== undefined)
            updateData.description = description;
        await drizzle_1.db.update(schema_1.roles).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId));
        // Update permissions if provided
        if (permissionIds !== undefined) {
            // Remove existing permissions
            await drizzle_1.db
                .delete(schema_1.rolePermissions)
                .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, roleId));
            // Add new permissions
            if (permissionIds.length > 0) {
                await drizzle_1.db.insert(schema_1.rolePermissions).values(permissionIds.map((permId) => ({
                    roleId,
                    permissionId: permId,
                })));
            }
        }
        await activityService.logActivity({
            userId: userId,
            workspaceId: workspaceId,
            action: `updated role "${name || existingRole.name}"`,
            entityType: "role",
            entityId: roleId,
            details: { roleName: name || existingRole.name },
        });
        return this.getRoleById(roleId);
    }
    /**
     * Delete a role (only non-system roles)
     */
    async deleteRole(roleId, userId, workspaceId) {
        const [role] = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
            .limit(1);
        if (!role)
            throw new Error("Role not found");
        if (role.isSystem)
            throw new Error("Cannot delete system roles");
        const [fallbackRole] = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.name, "Employee"))
            .limit(1);
        if (!fallbackRole)
            throw new Error("Fallback role not found");
        // Reassign users
        await drizzle_1.db
            .update(schema_1.workspaceMembers)
            .set({ roleId: fallbackRole.id })
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, roleId));
        await drizzle_1.db
            .update(schema_1.users)
            .set({ roleId: fallbackRole.id })
            .where((0, drizzle_orm_1.eq)(schema_1.users.roleId, roleId));
        // Delete related records
        await drizzle_1.db.delete(schema_1.rolePermissions).where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, roleId));
        await drizzle_1.db
            .delete(schema_1.userPermissions)
            .where((0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, roleId)); // ✅ ADD THIS
        await drizzle_1.db.delete(schema_1.roles).where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId));
        // Log activity
        await activityService.logActivity({
            userId,
            workspaceId,
            action: `deleted role "${role.name}"`,
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
        return drizzle_1.db.select().from(schema_1.permissions);
    }
}
exports.RoleService = RoleService;
