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
        const rolePerms = await drizzle_1.db
            .select({ name: schema_1.permissions.name })
            .from(schema_1.rolePermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, roleId));
        const permissionSet = new Set(rolePerms.map((p) => p.name));
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
        const whereClause = workspaceId
            ? (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.users.id, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId))
            : (0, drizzle_orm_1.eq)(schema_1.users.id, userId);
        const [user] = await drizzle_1.db
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
            .from(schema_1.users)
            .innerJoin(schema_1.workspaceMembers, (0, drizzle_orm_1.eq)(schema_1.users.id, schema_1.workspaceMembers.userId))
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
            .leftJoin(schema_1.teams, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.teamId, schema_1.teams.id))
            .where(whereClause)
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
    async createUser(input, workspaceId, createdById) {
        const { name, email, password, roleId, team, phone } = input;
        // Validate role exists
        const [role] = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.id, roleId))
            .limit(1);
        if (!role) {
            throw new Error("Invalid role");
        }
        // Check if user already exists
        const [existingUser] = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        let userId;
        let isNewUser = false;
        // Look up team ID if team name is provided
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
            // User exists - check if already in this workspace
            const [existingMember] = await drizzle_1.db
                .select()
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, existingUser.id), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
                .limit(1);
            if (existingMember) {
                throw new Error("User is already a member of this workspace");
            }
            userId = existingUser.id;
        }
        else {
            // Create new user
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
            // FIXED: No roleId, workspaceId, team, teamId in users table
            await drizzle_1.db.insert(schema_1.users).values({
                id: userId,
                email,
                name,
                phone: phone || null,
                password: hashedPassword,
                isActive: true,
                emailVerified: true,
            });
        }
        // Add user to workspace_members
        await drizzle_1.db.insert(schema_1.workspaceMembers).values({
            id: (0, uuid_1.v4)(),
            userId: userId,
            workspaceId: workspaceId,
            roleId: roleId,
            teamId: teamId,
        });
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
        return this.getUserById(userId, workspaceId);
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
            const [emailTaken] = await drizzle_1.db
                .select()
                .from(schema_1.users)
                .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
                .limit(1);
            if (emailTaken) {
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
        // Update global user fields
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (phone !== undefined)
            updateData.phone = phone;
        if (isActive !== undefined)
            updateData.isActive = isActive;
        if (Object.keys(updateData).length > 0) {
            await drizzle_1.db.update(schema_1.users).set(updateData).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }
        // Check if member exists in workspace_members
        const [existingMember] = await drizzle_1.db
            .select()
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
            .limit(1);
        if (!existingMember) {
            // Add to workspace_members
            await drizzle_1.db.insert(schema_1.workspaceMembers).values({
                id: (0, uuid_1.v4)(),
                userId: userId,
                workspaceId: workspaceId,
                roleId: roleId || "",
                teamId: null,
            });
        }
        // Update role in workspace_members
        if (roleId) {
            await drizzle_1.db
                .update(schema_1.workspaceMembers)
                .set({ roleId: roleId })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
        }
        // Update team in workspace_members
        if (team !== undefined) {
            if (team && team.trim() !== "") {
                const [teamRecord] = await drizzle_1.db
                    .select({ id: schema_1.teams.id, name: schema_1.teams.name })
                    .from(schema_1.teams)
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.teams.name, team), (0, drizzle_orm_1.eq)(schema_1.teams.workspaceId, workspaceId)))
                    .limit(1);
                if (teamRecord) {
                    await drizzle_1.db
                        .update(schema_1.workspaceMembers)
                        .set({ teamId: teamRecord.id })
                        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
                }
            }
            else {
                await drizzle_1.db
                    .update(schema_1.workspaceMembers)
                    .set({ teamId: null })
                    .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
            }
        }
        // Log activity
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
        // Delete workspace_members first
        await drizzle_1.db
            .delete(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)));
        // Delete user permission overrides
        await drizzle_1.db.delete(schema_1.userPermissions).where((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId));
        // Delete activity logs
        await drizzle_1.db.delete(schema_1.activityLogs).where((0, drizzle_orm_1.eq)(schema_1.activityLogs.userId, userId));
        // Delete attendance records
        await drizzle_1.db.delete(schema_1.attendance).where((0, drizzle_orm_1.eq)(schema_1.attendance.userId, userId));
        // Delete leaves
        await drizzle_1.db.delete(schema_1.leaves).where((0, drizzle_orm_1.eq)(schema_1.leaves.userId, userId));
        // Nullify task references
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
        // Nullify email template references
        await drizzle_1.db
            .update(schema_1.emailTemplates)
            .set({ createdById: (0, drizzle_orm_1.sql) `NULL` })
            .where((0, drizzle_orm_1.eq)(schema_1.emailTemplates.createdById, userId));
        // Check if user has other workspace memberships
        const [otherMembership] = await drizzle_1.db
            .select()
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId))
            .limit(1);
        // Only delete user if no other workspace memberships
        if (!otherMembership) {
            await drizzle_1.db.delete(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        }
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
        await drizzle_1.db.delete(schema_1.userPermissions).where((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId));
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
        const [existing] = await drizzle_1.db
            .select()
            .from(schema_1.userPermissions)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, permissionId)))
            .limit(1);
        if (existing) {
            await drizzle_1.db
                .update(schema_1.userPermissions)
                .set({ granted })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userPermissions.userId, userId), (0, drizzle_orm_1.eq)(schema_1.userPermissions.permissionId, permissionId)));
        }
        else {
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
    /**
     * Change password
     */
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
