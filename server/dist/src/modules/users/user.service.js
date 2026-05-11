"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
// src/modules/users/user.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const email_service_1 = require("../auth/email.service");
const activity_service_1 = require("../activity/activity.service");
const emailService = new email_service_1.EmailService();
const activityService = new activity_service_1.ActivityService();
class UserService {
    /**
     * Helper: Generate avatar initials from name
     */
    getInitials(name) {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    }
    /**
     * Helper: Get user permissions (role defaults + overrides)
     */
    async getUserPermissions(userId, roleId) {
        // Get role default permissions
        const rolePerms = await drizzle_1.db
            .select({ name: schema_1.permissions.name })
            .from(schema_1.rolePermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, roleId));
        const permissionSet = new Set(rolePerms.map((p) => p.name));
        // Apply user-specific overrides
        const overrides = await drizzle_1.db
            .select({
            name: schema_1.permissions.name,
            granted: schema_1.userPermissions.granted,
        })
            .from(schema_1.userPermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId));
        overrides.forEach((override) => {
            if (override.granted === true) {
                permissionSet.add(override.name);
            }
            else {
                permissionSet.delete(override.name);
            }
        });
        return Array.from(permissionSet);
    }
    /**
     * Get all users in a workspace
     */
    async getWorkspaceUsers(workspaceId, search) {
        // Use a single query with conditional where
        const userList = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            phone: schema_1.users.phone,
            roleId: schema_1.workspaceMembers.roleId,
            role: schema_1.roles.name,
            team: schema_1.teams.name,
            teamId: schema_1.workspaceMembers.teamId,
            isActive: schema_1.users.isActive,
            emailVerified: schema_1.users.emailVerified,
            avatar: schema_1.users.avatar,
            workspaceId: schema_1.workspaceMembers.workspaceId,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt,
            lastLoginAt: schema_1.users.lastLoginAt,
        })
            .from(schema_1.workspaceMembers)
            .innerJoin(schema_1.users, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, schema_1.users.id))
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where(search
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId), (0, drizzle_orm_1.or)((0, drizzle_orm_1.like)(schema_1.users.name, `%${search}%`), (0, drizzle_orm_1.like)(schema_1.users.email, `%${search}%`)))
            : (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId));
        // Get permissions for each user
        const usersWithPermissions = await Promise.all(userList.map(async (user) => {
            const perms = await this.getUserPermissions(user.id, user.roleId);
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                roleId: user.roleId,
                team: user.team,
                teamId: user.teamId,
                isActive: user.isActive,
                emailVerified: user.emailVerified,
                avatar: user.avatar,
                avatarInitials: this.getInitials(user.name),
                workspaceId: user.workspaceId,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                lastLoginAt: user.lastLoginAt,
                permissions: perms,
                permissionsCount: perms.length,
            };
        }));
        return usersWithPermissions;
    }
    /**
     * Get single user by ID
     */
    async getUserById(userId, workspaceId) {
        const [user] = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            name: schema_1.users.name,
            email: schema_1.users.email,
            phone: schema_1.users.phone,
            roleId: workspaceId ? schema_1.workspaceMembers.roleId : schema_1.users.roleId,
            role: schema_1.roles.name,
            team: workspaceId ? schema_1.teams.name : schema_1.users.team,
            teamId: workspaceId ? schema_1.workspaceMembers.teamId : schema_1.users.teamId,
            isActive: schema_1.users.isActive,
            emailVerified: schema_1.users.emailVerified,
            avatar: schema_1.users.avatar,
            workspaceId: workspaceId
                ? schema_1.workspaceMembers.workspaceId
                : schema_1.users.workspaceId,
            createdAt: schema_1.users.createdAt,
            updatedAt: schema_1.users.updatedAt,
            lastLoginAt: schema_1.users.lastLoginAt,
        })
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where(workspaceId
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId))
            : (0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user) {
            throw new Error("User not found");
        }
        const perms = await this.getUserPermissions(user.id, user.roleId);
        return {
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            roleId: user.roleId,
            team: user.team,
            teamId: user.teamId,
            isActive: user.isActive,
            emailVerified: user.emailVerified,
            avatar: user.avatar,
            avatarInitials: this.getInitials(user.name),
            workspaceId: user.workspaceId,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt,
            permissions: perms,
            permissionsCount: perms.length,
        };
    }
    /**
     * Create a new user
     */
    // async createUser(
    //   input: CreateUserInput,
    //   workspaceId: string,
    //   createdById?: string,
    // ) {
    //   const { name, email, password, roleId, team, phone } = input;
    //   // Check if email already exists
    //   const existingUser = await db
    //     .select()
    //     .from(users)
    //     .where(eq(users.email, email))
    //     .limit(1);
    //   if (existingUser.length > 0) {
    //     throw new Error("User with this email already exists");
    //   }
    //   // Validate role exists
    //   const [role] = await db
    //     .select()
    //     .from(roles)
    //     .where(eq(roles.id, roleId))
    //     .limit(1);
    //   if (!role) {
    //     throw new Error("Invalid role");
    //   }
    //   // Hash password
    //   const hashedPassword = await argon2.hash(password, {
    //     type: argon2.argon2id,
    //     memoryCost: 19456,
    //     timeCost: 2,
    //     parallelism: 1,
    //   });
    //   const userId = uuidv4();
    //   // Create user
    //   await db.insert(users).values({
    //     id: userId,
    //     email,
    //     name,
    //     phone: phone || null,
    //     password: hashedPassword,
    //     roleId: roleId,
    //     workspaceId: workspaceId,
    //     team: team || null,
    //     isActive: true,
    //     emailVerified: true,
    //   });
    //   // Add user to workspace with role
    //   await db.insert(workspaceMembers).values({
    //     userId: userId,
    //     workspaceId: workspaceId,
    //     roleId: roleId,
    //   });
    //   await activityService.logActivity({
    //     userId: createdById || userId,
    //     workspaceId: workspaceId,
    //     action: "user_created",
    //     entityType: "user",
    //     entityId: userId,
    //     details: {
    //       userName: name,
    //       userEmail: email,
    //       role: role.name,
    //     },
    //   });
    //   // Send onboarding email
    //   try {
    //     const [workspace] = await db
    //       .select({ name: workspaces.name })
    //       .from(workspaces)
    //       .where(eq(workspaces.id, workspaceId))
    //       .limit(1);
    //     await emailService.sendOnboardingEmail(
    //       email,
    //       name,
    //       password,
    //       workspace?.name || "Your Workspace",
    //     );
    //   } catch (error) {
    //     console.error("Failed to send onboarding email:", error);
    //   }
    //   return this.getUserById(userId);
    // }
    async createUser(input, workspaceId, createdById) {
        const { name, email, password, roleId, team, phone } = input;
        // Check if user already exists
        const [existingUser] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        let userId;
        let isNewUser = false;
        // ✅ Look up team ID if team name is provided
        let teamId = null;
        if (team) {
            const [teamRecord] = await drizzle_1.db
                .select({ id: schema_1.teams.id })
                .from(schema_1.teams)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teams.name, team), (0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId)))
                .limit(1);
            teamId = teamRecord?.id || null;
        }
        if (existingUser) {
            // ✅ User exists - check if already in this workspace
            const [existingMember] = await drizzle_1.db
                .select()
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, existingUser.id), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
                .limit(1);
            if (existingMember) {
                throw new Error("User is already a member of this workspace");
            }
            // ✅ Reuse existing user
            userId = existingUser.id;
            // ✅ Update team info on existing user if provided
            if (team !== undefined) {
                await drizzle_1.db
                    .update(schema_1.users)
                    .set({ team: team || null, teamId })
                    .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
            }
        }
        else {
            // ✅ Create new user
            isNewUser = true;
            if (!password) {
                throw new Error("Password is required for new users");
            }
            const hashedPassword = await argon2_1.default.hash(password, {
                type: argon2_1.default.argon2id,
                memoryCost: 19456,
                timeCost: 2,
                parallelism: 1,
            });
            userId = (0, uuid_1.v4)();
            await drizzle_1.db.insert(schema_1.users).values({
                id: userId,
                email,
                name,
                phone: phone || null,
                password: hashedPassword,
                roleId: roleId,
                workspaceId: workspaceId,
                team: team || null,
                teamId: teamId, // ✅ Set teamId
                isActive: true,
                emailVerified: true,
            });
        }
        // ✅ Add user to new workspace
        await drizzle_1.db.insert(schema_1.workspaceMembers).values({
            userId: userId,
            workspaceId: workspaceId,
            roleId: roleId,
            teamId: teamId,
        });
        // Update role in users table if changing
        if (existingUser && roleId) {
            await drizzle_1.db.update(schema_1.users).set({ roleId }).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }
        // Log activity
        await activityService.logActivity({
            userId: createdById || userId,
            workspaceId: workspaceId,
            action: isNewUser
                ? `invited ${name || email} to workspace`
                : `added ${name || existingUser?.name} to workspace`,
            entityType: "user",
            entityId: userId,
            details: {
                userName: name || existingUser?.name,
                userEmail: email,
                isNewUser,
                team: team || null,
            },
        });
        // Send onboarding email only for new users
        if (isNewUser) {
            try {
                const [workspace] = await drizzle_1.db
                    .select({ name: schema_1.workspaces.name })
                    .from(schema_1.workspaces)
                    .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId))
                    .limit(1);
                await emailService.sendOnboardingEmail(email, name, password, workspace?.name || "Your Workspace");
            }
            catch (error) {
                console.error("Failed to send onboarding email:", error);
            }
        }
        return this.getUserById(userId);
    }
    /**
     * Update user details
     */
    async updateUser(userId, input, updatedById, workspaceId) {
        const { name, email, roleId, team, phone, isActive } = input;
        const [existingUser] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!existingUser) {
            throw new Error("User not found");
        }
        // Check email uniqueness if changed
        if (email && email !== existingUser.email) {
            const emailTaken = await drizzle_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
                .limit(1);
            if (emailTaken.length > 0) {
                throw new Error("Email already in use");
            }
        }
        // Validate role if changed
        if (roleId) {
            const [role] = await drizzle_1.db
                .select()
                .from(schema_1.roles)
                .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
                .limit(1);
            if (!role) {
                throw new Error("Invalid role");
            }
        }
        // ✅ Only update GLOBAL user fields (name, email, phone, isActive)
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (phone !== undefined)
            updateData.phone = phone;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        // Update user global fields
        if (Object.keys(updateData).length > 0) {
            await drizzle_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }
        // ✅ Check if member exists in workspace_members
        const [existingMember] = await drizzle_1.db
            .select()
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
            .limit(1);
        if (!existingMember) {
            // User not in workspace_members - add them
            const effectiveRoleId = roleId || existingUser.roleId;
            await drizzle_1.db.insert(schema_1.workspaceMembers).values({
                userId: userId,
                workspaceId: workspaceId,
                roleId: effectiveRoleId,
            });
            console.log(`✅ Added user ${userId} to workspace_members for workspace ${workspaceId}`);
        }
        // ✅ Update workspace_members for role (workspace-specific!)
        if (roleId) {
            await drizzle_1.db
                .update(schema_1.workspaceMembers)
                .set({ roleId: roleId })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
            console.log(`✅ Updated role in workspace_members for user ${userId} to ${roleId}`);
        }
        // ✅ Update team in workspace_members (workspace-specific!)
        if (team !== undefined) {
            if (team && team.trim() !== "") {
                // Look up the team in this workspace
                const [teamRecord] = await drizzle_1.db
                    .select({ id: schema_1.teams.id, name: schema_1.teams.name })
                    .from(schema_1.teams)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teams.name, team), (0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId)))
                    .limit(1);
                console.log(`🔵 Team lookup for "${team}" in workspace ${workspaceId}:`, teamRecord ? "FOUND" : "NOT FOUND");
                if (teamRecord) {
                    await drizzle_1.db
                        .update(schema_1.workspaceMembers)
                        .set({ teamId: teamRecord.id })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
                    console.log(`✅ Updated team in workspace_members to ${teamRecord.name} (${teamRecord.id})`);
                }
                else {
                    console.log(`⚠️ Team "${team}" not found in workspace ${workspaceId}`);
                }
            }
            else {
                // Clear team
                await drizzle_1.db
                    .update(schema_1.workspaceMembers)
                    .set({ teamId: null })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
                console.log(`✅ Cleared team in workspace_members`);
            }
        }
        // Log activity
        // User Updated
        await activityService.logActivity({
            userId: updatedById,
            workspaceId: workspaceId,
            action: `updated user ${name || existingUser.name}`,
            entityType: "user",
            entityId: userId,
            details: {
                userName: name || existingUser.name,
                userEmail: email || existingUser.email,
                changes: input,
            },
        });
        return this.getUserById(userId, workspaceId);
    }
    /**
     * Delete user and all related records
     */
    async deleteUser(userId, deletedById, workspaceId) {
        const [user] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user) {
            throw new Error("User not found");
        }
        // ✅ Delete related records first (order matters for foreign keys)
        // Delete user permission overrides
        await drizzle_1.db.delete(schema_1.userPermissions).where((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId));
        // Delete activity logs
        await drizzle_1.db.delete(schema_1.activityLogs).where((0, drizzle_orm_1.eq)(schema_1.activityLogs.userId, userId));
        // Delete attendance records
        await drizzle_1.db.delete(schema_1.attendance).where((0, drizzle_orm_1.eq)(schema_1.attendance.userId, userId));
        // Delete leaves
        await drizzle_1.db.delete(schema_1.leaves).where((0, drizzle_orm_1.eq)(schema_1.leaves.userId, userId));
        // ✅ Update tasks - set to SQL NULL for NOT NULL columns
        await drizzle_1.db
            .update(schema_1.tasks)
            .set({ assigneeId: (0, drizzle_orm_1.sql) `NULL` })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.assigneeId, userId));
        await drizzle_1.db
            .update(schema_1.tasks)
            .set({ createdById: (0, drizzle_orm_1.sql) `NULL` })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.createdById, userId));
        await drizzle_1.db
            .update(schema_1.tasks)
            .set({ updatedById: (0, drizzle_orm_1.sql) `NULL` })
            .where((0, drizzle_orm_1.eq)(schema_1.tasks.updatedById, userId));
        // Update email templates
        await drizzle_1.db
            .update(schema_1.emailTemplates)
            .set({ createdById: (0, drizzle_orm_1.sql) `NULL` })
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.createdById, userId));
        // ✅ Finally delete the user
        await drizzle_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        await activityService.logActivity({
            userId: deletedById,
            workspaceId: workspaceId,
            action: `removed user ${user.name}`,
            entityType: "user",
            entityId: userId,
            details: { userName: user.name, userEmail: user.email },
        });
        return { success: true, message: "User deleted successfully" };
    }
    /**
     * Update all user permissions (replace all overrides)
     */
    async updateUserPermissions(userId, permissions) {
        const [user] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user) {
            throw new Error("User not found");
        }
        // Remove existing overrides
        await drizzle_1.db.delete(schema_1.userPermissions).where((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId));
        // Insert new overrides
        if (permissions.length > 0) {
            await drizzle_1.db.insert(schema_1.userPermissions).values(permissions.map((p) => ({
                userId,
                permissionId: p.permissionId,
                granted: p.granted,
            })));
        }
        return this.getUserById(userId);
    }
    /**
     * Add a single permission override
     */
    async addUserPermission(userId, permissionId, granted = true) {
        // Check if override already exists
        const [existing] = await drizzle_1.db
            .select()
            .from(schema_1.userPermissions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, permissionId)))
            .limit(1);
        if (existing) {
            // Update existing
            await drizzle_1.db
                .update(schema_1.userPermissions)
                .set({ granted })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, permissionId)));
        }
        else {
            // Insert new
            await drizzle_1.db.insert(schema_1.userPermissions).values({
                userId,
                permissionId,
                granted,
            });
        }
        return this.getUserById(userId);
    }
    /**
     * Remove a permission override
     */
    async removeUserPermission(userId, permissionId) {
        await drizzle_1.db
            .delete(schema_1.userPermissions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, permissionId)));
        return this.getUserById(userId);
    }
    /**
     * Get all available roles
     */
    async getAllRoles() {
        return drizzle_1.db.select().from(schema_1.roles);
    }
    /**
     * Get all available permissions
     */
    async getAllPermissions() {
        return drizzle_1.db.select().from(schema_1.permissions);
    }
    async changePassword(userId, currentPassword, newPassword) {
        const [user] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
            .limit(1);
        if (!user)
            throw new Error("User not found");
        const isValid = await argon2_1.default.verify(user.password, currentPassword);
        if (!isValid)
            throw new Error("Current password is incorrect");
        const hashedPassword = await argon2_1.default.hash(newPassword);
        await drizzle_1.db
            .update(schema_1.users)
            .set({ password: hashedPassword })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        return { success: true };
    }
}
exports.UserService = UserService;
