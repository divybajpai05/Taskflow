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
  workspaceMembers,
  teams,
} from "../../db/schema";
import { eq, and, like, or, sql } from "drizzle-orm";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import { EmailService } from "../auth/email.service";
import { ActivityService } from "../activity/activity.service";

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
const activityService = new ActivityService();

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
        roleId: workspaceMembers.roleId,
        role: roles.name,
        team: teams.name,
        teamId: workspaceMembers.teamId,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        avatar: users.avatar,
        workspaceId: workspaceMembers.workspaceId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(workspaceMembers)
      .innerJoin(users, eq(workspaceMembers.userId, users.id))
      .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        search
          ? and(
              eq(workspaceMembers.workspaceId, workspaceId),
              or(
                like(users.name, `%${search}%`),
                like(users.email, `%${search}%`),
              ),
            )
          : eq(workspaceMembers.workspaceId, workspaceId),
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
  async getUserById(userId: string, workspaceId?: string) {
    const [user] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        roleId: workspaceId ? workspaceMembers.roleId : users.roleId,
        role: roles.name,
        team: workspaceId ? teams.name : users.team,
        teamId: workspaceId ? workspaceMembers.teamId : users.teamId,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        avatar: users.avatar,
        workspaceId: workspaceId
          ? workspaceMembers.workspaceId
          : users.workspaceId,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .innerJoin(workspaceMembers, eq(users.id, workspaceMembers.userId))
      .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(
        workspaceId
          ? and(
              eq(users.id, userId),
              eq(workspaceMembers.workspaceId, workspaceId),
            )
          : eq(users.id, userId),
      )
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

  async createUser(
    input: CreateUserInput,
    workspaceId: string,
    createdById?: string,
  ) {
    const { name, email, password, roleId, team, phone } = input;

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    let userId: string;
    let isNewUser = false;

    // ✅ Look up team ID if team name is provided
    let teamId: string | null = null;
    if (team) {
      const [teamRecord] = await db
        .select({ id: teams.id })
        .from(teams)
        .where(and(eq(teams.name, team), eq(teams.workspaceId, workspaceId)))
        .limit(1);
      teamId = teamRecord?.id || null;
    }

    if (existingUser) {
      // ✅ User exists - check if already in this workspace
      const [existingMember] = await db
        .select()
        .from(workspaceMembers)
        .where(
          and(
            eq(workspaceMembers.userId, existingUser.id),
            eq(workspaceMembers.workspaceId, workspaceId),
          ),
        )
        .limit(1);

      if (existingMember) {
        throw new Error("User is already a member of this workspace");
      }

      // ✅ Reuse existing user
      userId = existingUser.id;

      // ✅ Update team info on existing user if provided
      if (team !== undefined) {
        await db
          .update(users)
          .set({ team: team || null, teamId })
          .where(eq(users.id, userId));
      }
    } else {
      // ✅ Create new user
      isNewUser = true;

      if (!password) {
        throw new Error("Password is required for new users");
      }

      const hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 19456,
        timeCost: 2,
        parallelism: 1,
      });

      userId = uuidv4();

      await db.insert(users).values({
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
    await db.insert(workspaceMembers).values({
      userId: userId,
      workspaceId: workspaceId,
      roleId: roleId,
      teamId: teamId,
    });

    // Update role in users table if changing
    if (existingUser && roleId) {
      await db.update(users).set({ roleId }).where(eq(users.id, userId));
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
        const [workspace] = await db
          .select({ name: workspaces.name })
          .from(workspaces)
          .where(eq(workspaces.id, workspaceId))
          .limit(1);

        await emailService.sendOnboardingEmail(
          email,
          name,
          password!,
          workspace?.name || "Your Workspace",
        );
      } catch (error) {
        console.error("Failed to send onboarding email:", error);
      }
    }

    return this.getUserById(userId);
  }

  /**
   * Update user details
   */
  async updateUser(
    userId: string,
    input: UpdateUserInput,
    updatedById: string,
    workspaceId: string,
  ) {
    const { name, email, roleId, team, phone, isActive } = input;

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

    // ✅ Only update GLOBAL user fields (name, email, phone, isActive)
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update user global fields
    if (Object.keys(updateData).length > 0) {
      await db.update(users).set(updateData).where(eq(users.id, userId));
    }

    // ✅ Check if member exists in workspace_members
    const [existingMember] = await db
      .select()
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, userId),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (!existingMember) {
      // User not in workspace_members - add them
      const effectiveRoleId = roleId || existingUser.roleId;
      await db.insert(workspaceMembers).values({
        userId: userId,
        workspaceId: workspaceId,
        roleId: effectiveRoleId,
      });
      console.log(
        `✅ Added user ${userId} to workspace_members for workspace ${workspaceId}`,
      );
    }

    // ✅ Update workspace_members for role (workspace-specific!)
    if (roleId) {
      await db
        .update(workspaceMembers)
        .set({ roleId: roleId })
        .where(
          and(
            eq(workspaceMembers.userId, userId),
            eq(workspaceMembers.workspaceId, workspaceId),
          ),
        );
      console.log(
        `✅ Updated role in workspace_members for user ${userId} to ${roleId}`,
      );
    }

    // ✅ Update team in workspace_members (workspace-specific!)
    if (team !== undefined) {
      if (team && team.trim() !== "") {
        // Look up the team in this workspace
        const [teamRecord] = await db
          .select({ id: teams.id, name: teams.name })
          .from(teams)
          .where(and(eq(teams.name, team), eq(teams.workspaceId, workspaceId)))
          .limit(1);

        console.log(
          `🔵 Team lookup for "${team}" in workspace ${workspaceId}:`,
          teamRecord ? "FOUND" : "NOT FOUND",
        );

        if (teamRecord) {
          await db
            .update(workspaceMembers)
            .set({ teamId: teamRecord.id })
            .where(
              and(
                eq(workspaceMembers.userId, userId),
                eq(workspaceMembers.workspaceId, workspaceId),
              ),
            );
          console.log(
            `✅ Updated team in workspace_members to ${teamRecord.name} (${teamRecord.id})`,
          );
        } else {
          console.log(
            `⚠️ Team "${team}" not found in workspace ${workspaceId}`,
          );
        }
      } else {
        // Clear team
        await db
          .update(workspaceMembers)
          .set({ teamId: null })
          .where(
            and(
              eq(workspaceMembers.userId, userId),
              eq(workspaceMembers.workspaceId, workspaceId),
            ),
          );
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
  async deleteUser(userId: string, deletedById: string, workspaceId: string) {
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

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!user) throw new Error("User not found");

    const isValid = await argon2.verify(user.password, currentPassword);
    if (!isValid) throw new Error("Current password is incorrect");

    const hashedPassword = await argon2.hash(newPassword);
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    return { success: true };
  }
}
