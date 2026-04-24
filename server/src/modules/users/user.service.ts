// src/modules/users/user.service.ts
import { db } from "../../db/drizzle";
import {
  users,
  roles,
  permissions,
  rolePermissions,
  userPermissions,
  activityLogs,
  attendance,
  leaves,
  tasks,
  emailTemplates,
  workspaces,
} from "../../db/schema";
import { eq, and, like, or, sql } from "drizzle-orm";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "../auth/email.service";

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  roleId: string;
  team?: string;
  phone?: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  roleId?: string;
  team?: string;
  phone?: string;
  isActive?: boolean;
}

export interface UserPermissionInput {
  permissionId: string;
  granted: boolean;
}

const emailService = new EmailService();

export class UserService {
  /**
   * Helper: Generate avatar initials from name
   */
  private getInitials(name: string): string {
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
  private async getUserPermissions(
    userId: string,
    roleId: string,
  ): Promise<string[]> {
    // Get role default permissions
    const rolePerms = await db
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, roleId));

    const permissionSet = new Set<string>(
      rolePerms.map((p: { name: string }) => p.name),
    );

    // Apply user-specific overrides
    const overrides = await db
      .select({
        name: permissions.name,
        granted: userPermissions.granted,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    overrides.forEach((override: { name: string; granted: boolean | null }) => {
      if (override.granted === true) {
        permissionSet.add(override.name);
      } else {
        permissionSet.delete(override.name);
      }
    });

    return Array.from(permissionSet);
  }

  /**
   * Get all users in a workspace
   */
  async getWorkspaceUsers(workspaceId: string, search?: string) {
    // Use a single query with conditional where
    const userList = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        roleId: users.roleId,
        role: roles.name,
        team: users.team,
        teamId: users.teamId,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        avatar: users.avatar,
        workspaceId: users.workspaceId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(
        search
          ? and(
              eq(users.workspaceId, workspaceId),
              or(
                like(users.name, `%${search}%`),
                like(users.email, `%${search}%`),
              ),
            )
          : eq(users.workspaceId, workspaceId),
      );

    // Get permissions for each user
    const usersWithPermissions = await Promise.all(
      userList.map(async (user) => {
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
      }),
    );

    return usersWithPermissions;
  }

  /**
   * Get single user by ID
   */
  async getUserById(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        roleId: users.roleId,
        role: roles.name,
        team: users.team,
        teamId: users.teamId,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        avatar: users.avatar,
        workspaceId: users.workspaceId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
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
      avatarInitials: this.getInitials(user.name), // ✅ Generated
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
  async createUser(input: CreateUserInput, workspaceId: string) {
    const { name, email, password, roleId, team, phone } = input;

    // Check if email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Validate role exists
    const [role] = await db
      .select()
      .from(roles)
      .where(eq(roles.id, roleId))
      .limit(1);

    if (!role) {
      throw new Error("Invalid role");
    }

    // Hash password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    const userId = uuidv4();

    await db.insert(users).values({
      id: userId,
      email,
      name,
      phone: phone || null,
      password: hashedPassword,
      roleId,
      workspaceId,
      team: team || null,
      isActive: true,
      emailVerified: true, // Admin-created users are pre-verified
    });

    // ✅ Send onboarding email (don't fail if email fails)
    try {
      // Get workspace name
      const [workspace] = await db
        .select({ name: workspaces.name })
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      const workspaceName = workspace?.name || "Your Workspace";

      await emailService.sendOnboardingEmail(
        email,
        name,
        password, // Send the original password (before hashing)
        workspaceName,
      );
      console.log(`✅ Onboarding email sent to ${email}`);
    } catch (error) {
      console.error("Failed to send onboarding email:", error);
      // Don't throw - user creation should still succeed
    }

    return this.getUserById(userId);
  }

  /**
   * Update user details
   */
  async updateUser(userId: string, input: UpdateUserInput) {
    const { name, email, roleId, team, phone, isActive } = input;

    // Check if user exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!existingUser) {
      throw new Error("User not found");
    }

    // Check email uniqueness if changed
    if (email && email !== existingUser.email) {
      const emailTaken = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (emailTaken.length > 0) {
        throw new Error("Email already in use");
      }
    }

    // Validate role if changed
    if (roleId) {
      const [role] = await db
        .select()
        .from(roles)
        .where(eq(roles.id, roleId))
        .limit(1);

      if (!role) {
        throw new Error("Invalid role");
      }
    }

    // Build update object (only include fields that are provided)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (roleId !== undefined) updateData.roleId = roleId;
    if (team !== undefined) updateData.team = team;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    await db.update(users).set(updateData).where(eq(users.id, userId));

    return this.getUserById(userId);
  }

  // src/modules/users/user.service.ts

  /**
   * Delete user and all related records
   */
  async deleteUser(userId: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // ✅ Delete related records first (order matters for foreign keys)

    // Delete user permission overrides
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

    // Delete activity logs
    await db.delete(activityLogs).where(eq(activityLogs.userId, userId));

    // Delete attendance records
    await db.delete(attendance).where(eq(attendance.userId, userId));

    // Delete leaves
    await db.delete(leaves).where(eq(leaves.userId, userId));

    // ✅ Update tasks - set to SQL NULL for NOT NULL columns
    await db
      .update(tasks)
      .set({ assigneeId: sql`NULL` })
      .where(eq(tasks.assigneeId, userId));

    await db
      .update(tasks)
      .set({ createdById: sql`NULL` })
      .where(eq(tasks.createdById, userId));

    await db
      .update(tasks)
      .set({ updatedById: sql`NULL` })
      .where(eq(tasks.updatedById, userId));

    // Update email templates
    await db
      .update(emailTemplates)
      .set({ createdById: sql`NULL` })
      .where(eq(emailTemplates.createdById, userId));

    // ✅ Finally delete the user
    await db.delete(users).where(eq(users.id, userId));

    return { success: true, message: "User deleted successfully" };
  }
  /**
   * Update all user permissions (replace all overrides)
   */
  async updateUserPermissions(
    userId: string,
    permissions: UserPermissionInput[],
  ) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Remove existing overrides
    await db.delete(userPermissions).where(eq(userPermissions.userId, userId));

    // Insert new overrides
    if (permissions.length > 0) {
      await db.insert(userPermissions).values(
        permissions.map((p) => ({
          userId,
          permissionId: p.permissionId,
          granted: p.granted,
        })),
      );
    }

    return this.getUserById(userId);
  }

  /**
   * Add a single permission override
   */
  async addUserPermission(
    userId: string,
    permissionId: string,
    granted: boolean = true,
  ) {
    // Check if override already exists
    const [existing] = await db
      .select()
      .from(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId),
        ),
      )
      .limit(1);

    if (existing) {
      // Update existing
      await db
        .update(userPermissions)
        .set({ granted })
        .where(
          and(
            eq(userPermissions.userId, userId),
            eq(userPermissions.permissionId, permissionId),
          ),
        );
    } else {
      // Insert new
      await db.insert(userPermissions).values({
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
  async removeUserPermission(userId: string, permissionId: string) {
    await db
      .delete(userPermissions)
      .where(
        and(
          eq(userPermissions.userId, userId),
          eq(userPermissions.permissionId, permissionId),
        ),
      );

    return this.getUserById(userId);
  }

  /**
   * Get all available roles
   */
  async getAllRoles() {
    return db.select().from(roles);
  }

  /**
   * Get all available permissions
   */
  async getAllPermissions() {
    return db.select().from(permissions);
  }
}
