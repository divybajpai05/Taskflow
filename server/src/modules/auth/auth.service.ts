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
} from "../../db/schema";
import { eq } from "drizzle-orm";
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
    const adminRoleResult = await db
      .select()
      .from(roles)
      .where(eq(roles.name, "Admin"))
      .limit(1);

    const adminRole = adminRoleResult[0];

    if (!adminRole) {
      throw new Error(
        "Admin role not found. Please run database seeder first.",
      );
    }

    // Generate verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Start transaction
    return await db.transaction(async (tx) => {
      // 1. Create workspace
      const workspaceId = uuidv4();

      await tx.insert(workspaces).values({
        id: workspaceId,
        name: workspaceName,
        description: `${workspaceName} workspace`,
      });

      // 2. Create user (unverified)
      const userId = uuidv4();

      await tx.insert(users).values({
        id: userId,
        email,
        name,
        password: hashedPassword,
        roleId: adminRole.id,
        workspaceId: workspaceId,
        isActive: true,
        emailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress || null,
      });

      // 3. Set user as workspace owner
      await tx
        .update(workspaces)
        .set({ ownerId: userId })
        .where(eq(workspaces.id, workspaceId));

      // 4. Log activity
      await tx.insert(activityLogs).values({
        userId: userId,
        workspaceId: workspaceId,
        action: "user_registered",
        entityType: "user",
        entityId: userId,
        details: { workspaceName, email },
        ipAddress: ipAddress || null,
      });

      // 5. Send verification email
      try {
        await emailService.sendVerificationEmail(
          email,
          name,
          verificationToken,
        );
      } catch (error) {
        console.error("Failed to send verification email:", error);
        // Don't fail registration if email fails
      }

      // 6. Get user with permissions
      const userWithPerms = await this.getUserWithPermissions(userId, tx);

      // 7. Generate tokens
      const tokens = generateTokens({
        userId: userWithPerms.id,
        email: userWithPerms.email,
        workspaceId: userWithPerms.workspaceId,
        roleId: adminRole.id,
      });

      // 8. Store refresh token
      const hashedRefreshToken = await argon2.hash(tokens.refreshToken);
      await tx
        .update(users)
        .set({ refreshToken: hashedRefreshToken })
        .where(eq(users.id, userId));

      // 9. Generate avatar initials
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
          team: userWithPerms.team,
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
  // async verifyEmail(
  //   token: string,
  // ): Promise<{ success: boolean; message: string }> {
  //   // Find user with this token
  //   const userResult = await db
  //     .select()
  //     .from(users)
  //     .where(eq(users.emailVerificationToken, token))
  //     .limit(1);

  //   const user = userResult[0];

  //   if (!user) {
  //     throw new Error("Invalid or expired verification token");
  //   }

  //   // Check if token is expired
  //   if (
  //     user.emailVerificationExpires &&
  //     new Date() > user.emailVerificationExpires
  //   ) {
  //     throw new Error(
  //       "Verification token has expired. Please request a new one.",
  //     );
  //   }

  //   // Update user as verified
  //   await db
  //     .update(users)
  //     .set({
  //       emailVerified: true,
  //       emailVerificationToken: null,
  //       emailVerificationExpires: null,
  //     })
  //     .where(eq(users.id, user.id));

  //   // Send welcome email
  //   try {
  //     await emailService.sendWelcomeEmail(user.email, user.name);
  //   } catch (error) {
  //     console.error("Failed to send welcome email:", error);
  //   }

  //   // Log activity
  //   await db.insert(activityLogs).values({
  //     userId: user.id,
  //     workspaceId: user.workspaceId,
  //     action: "email_verified",
  //     entityType: "user",
  //     entityId: user.id,
  //   });

  //   return {
  //     success: true,
  //     message: "Email verified successfully! You can now log in.",
  //   };
  // }

  // src/modules/auth/auth.service.ts

  /**
   * Verify email with token
   */
  async verifyEmail(
    token: string,
  ): Promise<{ success: boolean; message: string }> {
    console.log("🔍 Starting email verification...");

    // Find user with this token
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.emailVerificationToken, token))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      console.error("❌ No user found with token:", token?.substring(0, 20));
      throw new Error("Invalid or expired verification token");
    }

    console.log("✅ User found:", user.email);

    // Check if token is expired
    if (
      user.emailVerificationExpires &&
      new Date() > user.emailVerificationExpires
    ) {
      console.error("❌ Token expired at:", user.emailVerificationExpires);
      throw new Error(
        "Verification token has expired. Please request a new one.",
      );
    }

    // Check if already verified
    if (user.emailVerified) {
      console.log("ℹ️ Email already verified");
      return {
        success: true,
        message: "Email already verified! You can now log in.",
      };
    }

    // ✅ Update user as verified
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

    // ✅ Send welcome email (non-critical)
    try {
      await emailService.sendWelcomeEmail(user.email, user.name);
      console.log("✅ Welcome email sent");
    } catch (error) {
      console.error("⚠️ Failed to send welcome email:", error);
      // Don't throw - verification succeeded
    }

    // ✅ Log activity (non-critical)
    try {
      await db.insert(activityLogs).values({
        userId: user.id,
        workspaceId: user.workspaceId,
        action: "email_verified",
        entityType: "user",
        entityId: user.id,
      });
      console.log("✅ Activity logged");
    } catch (error) {
      console.error("⚠️ Failed to log activity:", error);
      // Don't throw - verification succeeded
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
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      throw new Error("User not found");
    }

    if (user.emailVerified) {
      throw new Error("Email is already verified");
    }

    // Generate new token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db
      .update(users)
      .set({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      })
      .where(eq(users.id, user.id));

    // Send email
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

    const userResult = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        password: users.password,
        roleId: users.roleId,
        roleName: roles.name,
        team: users.team,
        workspaceId: users.workspaceId,
        workspaceName: workspaces.name,
        avatar: users.avatar,
        isActive: users.isActive,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .innerJoin(workspaces, eq(users.workspaceId, workspaces.id))
      .where(eq(users.email, email))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.isActive) {
      throw new Error("Account is deactivated. Please contact administrator.");
    }

    // Check if email is verified
    if (!user.emailVerified) {
      throw new Error(
        "Please verify your email before logging in. Check your inbox for the verification link.",
      );
    }

    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    const userWithPerms = await this.getUserWithPermissions(user.id);

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      workspaceId: user.workspaceId,
      roleId: user.roleId,
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
      workspaceId: user.workspaceId,
      action: "user_login",
      entityType: "user",
      entityId: user.id,
      ipAddress: ipAddress || null,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.roleName,
        team: user.team,
        workspaceId: user.workspaceId,
        workspaceName: user.workspaceName,
        avatar: user.avatar,
        permissions: userWithPerms.permissions,
        avatarInitials,
        emailVerified: user.emailVerified,
      },
      tokens: {
        accessToken: tokens.accessToken,
      },
      refreshToken: tokens.refreshToken,
    };
  }

  /**
   * Forgot password - send reset email
   */
  async forgotPassword(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      // Return success even if user not found (security)
      return {
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      };
    }

    const resetToken = generateVerificationToken();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

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
    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.passwordResetToken, token))
      .limit(1);

    const user = userResult[0];

    if (!user) {
      throw new Error("Invalid or expired reset token");
    }

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
        refreshToken: null, // Invalidate all sessions
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

    const userResult = await db
      .select()
      .from(users)
      .where(eq(users.id, decoded.userId))
      .limit(1);

    const user = userResult[0];

    if (!user || !user.refreshToken) {
      throw new Error("Invalid refresh token");
    }

    const isValid = await argon2.verify(user.refreshToken, refreshToken);
    if (!isValid) {
      throw new Error("Invalid refresh token");
    }

    const tokens = generateTokens({
      userId: user.id,
      email: user.email,
      workspaceId: user.workspaceId,
      roleId: user.roleId,
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
   * Get user with all permissions
   */
  async getUserWithPermissions(
    userId: string,
    tx?: any,
  ): Promise<UserWithPermissions> {
    const dbInstance = tx || db;

    const userResult = await dbInstance
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        roleId: users.roleId,
        roleName: roles.name,
        team: users.team,
        workspaceId: users.workspaceId,
        emailVerified: users.emailVerified,
      })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));

    const user = userResult[0];

    if (!user) {
      throw new Error("User not found");
    }

    // Get role default permissions
    const rolePerms = await dbInstance
      .select({ name: permissions.name })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(eq(rolePermissions.roleId, user.roleId));

    // Create Set with explicit string type
    const permissionSet = new Set<string>();
    rolePerms.forEach((p: { name: string }) => {
      permissionSet.add(p.name);
    });

    // Get user-specific permission overrides
    const overrides = await dbInstance
      .select({
        name: permissions.name,
        granted: userPermissions.granted,
      })
      .from(userPermissions)
      .innerJoin(permissions, eq(userPermissions.permissionId, permissions.id))
      .where(eq(userPermissions.userId, userId));

    overrides.forEach((override: { name: string; granted: boolean }) => {
      if (override.granted) {
        permissionSet.add(override.name);
      } else {
        permissionSet.delete(override.name);
      }
    });

    // Cast to string[]
    const permissionsArray: string[] = Array.from(permissionSet);

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.roleName,
      team: user.team,
      workspaceId: user.workspaceId,
      permissions: permissionsArray,
      emailVerified: user.emailVerified,
    };
  }
}
