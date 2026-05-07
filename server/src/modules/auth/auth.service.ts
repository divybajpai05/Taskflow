// src/modules/auth/auth.service.ts
import { db } from "../../db/drizzle";
import {
  users,
  workspaces,
  roles,
  permissions,
  rolePermissions,
  userPermissions,
  activityLogs,
  workspaceMembers,
  teams,
} from "../../db/schema";
import { and, eq } from "drizzle-orm";
import argon2 from "argon2";
import { v4 as uuidv4 } from "uuid";
import {
  generateTokens,
  verifyRefreshToken,
  generateVerificationToken,
} from "../../utils/jwt";
import {
  RegisterInput,
  LoginInput,
  AuthResponse,
  UserWithPermissions,
} from "./auth.types";
import { EmailService } from "./email.service";

const emailService = new EmailService();

export class AuthService {
  /**
   * Register a new user, create workspace, and send verification email
   */
  async register(
    input: RegisterInput,
    ipAddress?: string,
  ): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    message: string;
  }> {
    const { workspaceName, name, email, password } = input;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("User with this email already exists");
    }

    // Check if workspace name is taken
    const existingWorkspace = await db
      .select()
      .from(workspaces)
      .where(eq(workspaces.name, workspaceName))
      .limit(1);

    if (existingWorkspace.length > 0) {
      throw new Error(
        "Workspace name is already taken. Please choose another.",
      );
    }

    // Hash password
    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    // Get Admin role
    const [adminRole] = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Admin"))
      .limit(1);

    if (!adminRole) {
      throw new Error(
        "Admin role not found. Please run database seeder first.",
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return await db.transaction(async (tx) => {
      // 1. Create workspace
      const workspaceId = uuidv4();
      await tx.insert(workspaces).values({
        id: workspaceId,
        name: workspaceName,
        description: `${workspaceName} workspace`,
      });

      // 2. Create user (NO roleId, workspaceId, team, teamId)
      const userId = uuidv4();
      await tx.insert(users).values({
        id: userId,
        email,
        name,
        password: hashedPassword,
        isActive: true,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || null,
      });

      // 3. Add user to workspace_members as Admin
      await tx.insert(workspaceMembers).values({
        id: uuidv4(),
        userId: userId,
        workspaceId: workspaceId,
        roleId: adminRole.id,
        teamId: null,
      });

      // 4. Set user as workspace owner
      await tx
        .update(workspaces)
        .set({ ownerId: userId })
        .where(eq(workspaces.id, workspaceId));

      // 5. Log activity
      await tx.insert(activityLogs).values({
        userId: userId,
        workspaceId: workspaceId,
        action: `registered and created workspace "${workspaceName}"`,
        entityType: "user",
        entityId: userId,
        details: { workspaceName, email },
        ipAddress: ipAddress || null,
      });

      // 6. Send verification email
      try {
        await emailService.sendVerificationEmail(
          email,
          name,
          verificationToken,
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
      }

      // 7. Get user with permissions
      const userWithPerms = await this.getUserWithPermissions(
        userId,
        workspaceId,
        tx,
      );

      // 8. Generate tokens
      const tokens = generateTokens({
        userId: userWithPerms.id,
        email: userWithPerms.email,
        workspaceId: userWithPerms.workspaceId,
        roleId: adminRole.id,
      });

      // 9. Store refresh token
      const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
      await tx
        .update(users)
        .set({ refreshToken: hashedRefreshToken })
        .where(eq(users.id, userId));

      // 10. Generate avatar initials
      const avatarInitials = name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      return {
        user: {
          id: userWithPerms.id,
          email: userWithPerms.email,
          name: userWithPerms.name,
          role: userWithPerms.role,
          team: userWithPerms.team || null,
          teamId: userWithPerms.teamId || null,
          workspaceId: userWithPerms.workspaceId,
          workspaceName: workspaceName,
          avatar: null,
          permissions: userWithPerms.permissions,
          avatarInitials,
          emailVerified: false,
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        message:
          "Registration successful! Please check your email to verify your account.",
      };
    });
  }

  /**
   * Verify email with token
   */
  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log("🔍 Starting email verification...");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    if (!user) {
      console.error("❌ No user found with token:", token?.substring(0, 20));
      throw new Error("Invalid or expired verification token");
    }

    console.log("✅ User found:", user.email);

    if (
      user.emailVerificationExpires &&
      new Date() > user.emailVerificationExpires
    ) {
      console.error("❌ Token expired at:", user.emailVerificationExpires);
      throw new Error(
        "Verification token has expired. Please request a new one.",
      );
    }

    if (user.emailVerified) {
      console.log("ℹ️ Email already verified");
      return {
        success: true,
        message: "Email already verified! You can now log in.",
      };
    }

    console.log("📝 Updating user verification status...");
    await db
      .update(users)
      .set({
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      })
      .where(eq(users.id, user.id));

    console.log("✅ User verified in database");

    // Get workspace for activity log
    const [member] = await db
      .select({ workspaceId: workspaceMembers.workspaceId })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1);

    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
      console.log("✅ Welcome email sent");
    } catch (error) {
      console.error("⚠️ Failed to send welcome email:", error);
    }

    try {
      await db.insert(activityLogs).values({
        userId: user.id,
        workspaceId: member?.workspaceId || null,
        action: `${user.name} verified their email`,
        entityType: "user",
        entityId: user.id,
      });
      console.log("✅ Activity logged");
    } catch (error) {
      console.error("⚠️ Failed to log activity:", error);
    }

    console.log("🎉 Email verification complete!");
    return {
      success: true,
      message: "Email verified successfully! You can now log in.",
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) throw new Error("User not found");
    if (user.emailVerified) throw new Error("Email is already verified");

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      })
      .where(eq(users.id, user.id));

    await emailService.sendVerificationEmail(
      user.email,
      user.name,
      verificationToken,
    );

    return {
      success: true,
      message: "Verification email sent! Please check your inbox.",
    };
  }

  /**
   * Login user
   */
  async login(
    input: LoginInput,
    ipAddress?: string,
  ): Promise<AuthResponse & { refreshToken: string }> {
    const { email, password } = input;

    // FIXED: Only select columns that exist in users table
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
        avatar: users.avatar,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
        phone: users.phone,
        lastLoginAt: users.lastLoginAt,
        lastLoginIp: users.lastLoginIp,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) throw new Error("Invalid email or password");
    if (!user.isActive) throw new Error("Account is deactivated.");
    if (!user.emailVerified)
      throw new Error("Please verify your email before logging in.");

    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) throw new Error("Invalid email or password");

    // FIXED: Get user's workspaces from workspace_members
    const userWorkspaces = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        workspaceName: workspaces.name,
        roleId: workspaceMembers.roleId,
        roleName: roles.name,
        teamId: workspaceMembers.teamId,
        teamName: teams.name,
      })
      .from(workspaceMembers)
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(eq(workspaceMembers.userId, user.id));

    if (userWorkspaces.length === 0) {
      throw new Error(
        "You are not a member of any workspace. Please contact your administrator.",
      );
    }

    const activeWorkspace = userWorkspaces[0];

    // Get permissions for active workspace
    const userWithPerms = await this.getUserWithPermissions(
      user.id,
      activeWorkspace.workspaceId,
    );

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      workspaceId: activeWorkspace.workspaceId,
      roleId: activeWorkspace.roleId,
    });

    const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
    await db
      .update(users)
      .set({
        refreshToken: hashedRefreshToken,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || null,
      })
      .where(eq(users.id, user.id));

    const avatarInitials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    // Log activity
    await db.insert(activityLogs).values({
      userId: user.id,
      workspaceId: activeWorkspace.workspaceId,
      action: `${user.name} logged in`,
      entityType: "user",
      entityId: user.id,
      ipAddress: ipAddress || null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: activeWorkspace.roleName,
        team: activeWorkspace.teamName || null,
        teamId: activeWorkspace.teamId || null,
        phone: user.phone,
        workspaceId: activeWorkspace.workspaceId,
        workspaceName: activeWorkspace.workspaceName,
        avatar: user.avatar,
        permissions: userWithPerms.permissions,
        avatarInitials,
        emailVerified: user.emailVerified,
        lastLoginAt: user.lastLoginAt?.toISOString() || null,
        lastLoginIp: user.lastLoginIp || null,
        workspaces: userWorkspaces.map((w) => ({
          workspaceId: w.workspaceId,
          workspaceName: w.workspaceName,
          roleId: w.roleId,
          roleName: w.roleName,
        })),
        activeWorkspaceId: activeWorkspace.workspaceId,
        activeWorkspaceName: activeWorkspace.workspaceName,
      },
      tokens: { accessToken: tokens.accessToken },
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Forgot password
   */
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    }

    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      })
      .where(eq(users.id, user.id));

    await emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
    );

    return {
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    };
  }

  /**
   * Reset password
   */
  async resetPassword(
    token: string,
    password: string,
  ): Promise<{ success: boolean; message: string }> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    if (!user) throw new Error("Invalid or expired reset token");
    if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
      throw new Error("Reset token has expired. Please request a new one.");
    }

    const hashedPassword = await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });

    await db
      .update(users)
      .set({
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        refreshToken: null,
      })
      .where(eq(users.id, user.id));

    return {
      success: true,
      message:
        "Password reset successfully! You can now log in with your new password.",
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const decoded = verifyRefreshToken(refreshToken);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    if (!user || !user.refreshToken) throw new Error("Invalid refresh token");

    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) throw new Error("Invalid refresh token");

    // Get workspace from workspace_members
    const [member] = await db
      .select({
        workspaceId: workspaceMembers.workspaceId,
        roleId: workspaceMembers.roleId,
      })
      .from(workspaceMembers)
      .where(eq(workspaceMembers.userId, user.id))
      .limit(1);

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      workspaceId: member?.workspaceId || "",
      roleId: member?.roleId || "",
    });

    return { accessToken: tokens.accessToken };
  }

  /**
   * Logout user
   */
  async logout(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ refreshToken: null })
      .where(eq(users.id, userId));
  }

  /**
   * Get user with all permissions for a workspace
   */
  async getUserWithPermissions(
    userId: string,
    workspaceId?: string,
    tx?: any,
  ): Promise<UserWithPermissions> {
    const dbInstance = tx || db;

    // FIXED: Get user from users table (no roleId, workspaceId, team there)
    const [user] = await dbInstance
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) throw new Error("User not found");

    // FIXED: Get role, workspace, team from workspace_members
    let memberWhere;
    if (workspaceId) {
      memberWhere = and(
        eq(workspaceMembers.userId, userId),
        eq(workspaceMembers.workspaceId, workspaceId),
      );
    } else {
      memberWhere = eq(workspaceMembers.userId, userId);
    }

    const [member] = await dbInstance
      .select({
        roleId: workspaceMembers.roleId,
        roleName: roles.name,
        workspaceId: workspaceMembers.workspaceId,
        workspaceName: workspaces.name,
        teamId: workspaceMembers.teamId,
        teamName: teams.name,
      })
      .from(workspaceMembers)
      .innerJoin(roles, eq(workspaceMembers.roleId, roles.id))
      .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
      .leftJoin(teams, eq(workspaceMembers.teamId, teams.id))
      .where(memberWhere)
      .limit(1);

    if (!member) {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: "",
        team: null,
        teamId: null,
        workspaceId: "",
        permissions: [],
        emailVerified: user.emailVerified,
      };
    }

    console.log("🔵 getUserWithPermissions:", {
      userId,
      workspaceId: member.workspaceId,
      roleId: member.roleId,
      roleName: member.roleName,
    });

    // Get role permissions
    const rolePerms = await dbInstance
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, member.roleId));

    const permissionSet = new Set<string>();
    rolePerms.forEach((p: { name: string }) => permissionSet.add(p.name));

    console.log(
      `🔵 Role "${member.roleName}" default permissions:`,
      permissionSet.size,
    );

    // Get user-specific permission overrides
    const overrides = await dbInstance
      .select({ name: permissions.name, granted: userPermissions.granted })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    overrides.forEach((override: { name: string; granted: boolean | null }) => {
      if (override.granted === true) {
        permissionSet.add(override.name);
      } else if (override.granted === false) {
        permissionSet.delete(override.name);
      }
    });

    const permissionsArray: string[] = Array.from(permissionSet);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: member.roleName,
      team: member.teamName || null,
      teamId: member.teamId || null,
      workspaceId: member.workspaceId,
      permissions: permissionsArray,
      emailVerified: user.emailVerified,
    };
  }
}
