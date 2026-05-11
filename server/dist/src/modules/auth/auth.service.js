"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
// src/modules/auth/auth.service.ts
const drizzle_1 = require("../../db/drizzle");
const schema_1 = require("../../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const argon2_1 = __importDefault(require("argon2"));
const uuid_1 = require("uuid");
const jwt_1 = require("../../utils/jwt");
const email_service_1 = require("./email.service");
const emailService = new email_service_1.EmailService();
class AuthService {
    /**
     * Register a new user, create workspace, and send verification email
     */
    async register(input, ipAddress) {
        const { workspaceName, name, email, password } = input;
        // Check if user exists
        const existingUser = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        if (existingUser.length > 0) {
            throw new Error("User with this email already exists");
        }
        // Check if workspace name is taken
        const existingWorkspace = await drizzle_1.db
            .select()
            .from(schema_1.workspaces)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaces.name, workspaceName))
            .limit(1);
        if (existingWorkspace.length > 0) {
            throw new Error("Workspace name is already taken. Please choose another.");
        }
        // Hash password
        const hashedPassword = await argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        });
        // Get Admin role
        const adminRoleResult = await drizzle_1.db
            .select()
            .from(schema_1.roles)
            .where((0, drizzle_orm_1.eq)(schema_1.roles.name, "Admin"))
            .limit(1);
        const adminRole = adminRoleResult[0];
        if (!adminRole) {
            throw new Error("Admin role not found. Please run database seeder first.");
        }
        // Generate verification token
        const verificationToken = (0, jwt_1.generateVerificationToken)();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        // Start transaction
        return await drizzle_1.db.transaction(async (tx) => {
            // 1. Create workspace
            const workspaceId = (0, uuid_1.v4)();
            await tx.insert(schema_1.workspaces).values({
                id: workspaceId,
                name: workspaceName,
                description: `${workspaceName} workspace`,
            });
            // 2. Create user (unverified)
            const userId = (0, uuid_1.v4)();
            await tx.insert(schema_1.users).values({
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
                .update(schema_1.workspaces)
                .set({ ownerId: userId })
                .where((0, drizzle_orm_1.eq)(schema_1.workspaces.id, workspaceId));
            // 4. Log activity
            await tx.insert(schema_1.activityLogs).values({
                userId: userId,
                workspaceId: workspaceId,
                action: `registered and created workspace "${workspaceName}"`,
                entityType: "user",
                entityId: userId,
                details: { workspaceName, email },
                ipAddress: ipAddress || null,
            });
            // 5. Send verification email
            try {
                await emailService.sendVerificationEmail(email, name, verificationToken);
            }
            catch (error) {
                console.error("Failed to send verification email:", error);
                // Don't fail registration if email fails
            }
            // 6. Get user with permissions
            const userWithPerms = await this.getUserWithPermissions(userId, undefined, tx);
            // 7. Generate tokens
            const tokens = (0, jwt_1.generateTokens)({
                userId: userWithPerms.id,
                email: userWithPerms.email,
                workspaceId: userWithPerms.workspaceId,
                roleId: adminRole.id,
            });
            // 8. Store refresh token
            const hashedRefreshToken = await argon2_1.default.hash(tokens.refreshToken);
            await tx
                .update(schema_1.users)
                .set({ refreshToken: hashedRefreshToken })
                .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
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
                message: "Registration successful! Please check your email to verify your account.",
            };
        });
    }
    /**
     * Verify email with token
     */
    async verifyEmail(token) {
        console.log("🔍 Starting email verification...");
        // Find user with this token
        const userResult = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.emailVerificationToken, token))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            console.error("❌ No user found with token:", token?.substring(0, 20));
            throw new Error("Invalid or expired verification token");
        }
        console.log("✅ User found:", user.email);
        // Check if token is expired
        if (user.emailVerificationExpires &&
            new Date() > user.emailVerificationExpires) {
            console.error("❌ Token expired at:", user.emailVerificationExpires);
            throw new Error("Verification token has expired. Please request a new one.");
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
        await drizzle_1.db
            .update(schema_1.users)
            .set({
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        console.log("✅ User verified in database");
        // ✅ Send welcome email (non-critical)
        try {
            await emailService.sendWelcomeEmail(user.email, user.name);
            console.log("✅ Welcome email sent");
        }
        catch (error) {
            console.error("⚠️ Failed to send welcome email:", error);
            // Don't throw - verification succeeded
        }
        // ✅ Log activity (non-critical)
        try {
            await drizzle_1.db.insert(schema_1.activityLogs).values({
                userId: user.id,
                workspaceId: user.workspaceId,
                action: `${user.name} verified their email`,
                entityType: "user",
                entityId: user.id,
            });
            console.log("✅ Activity logged");
        }
        catch (error) {
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
    async resendVerificationEmail(email) {
        const userResult = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            throw new Error("User not found");
        }
        if (user.emailVerified) {
            throw new Error("Email is already verified");
        }
        // Generate new token
        const verificationToken = (0, jwt_1.generateVerificationToken)();
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
        await drizzle_1.db
            .update(schema_1.users)
            .set({
            emailVerificationToken: verificationToken,
            emailVerificationExpires: verificationExpires,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        // Send email
        await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
        return {
            success: true,
            message: "Verification email sent! Please check your inbox.",
        };
    }
    /**
     * Login user
     */
    async login(input, ipAddress) {
        const { email, password } = input;
        const userResult = await drizzle_1.db
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            name: schema_1.users.name,
            password: schema_1.users.password,
            roleId: schema_1.users.roleId,
            roleName: schema_1.roles.name,
            team: schema_1.users.team,
            teamId: schema_1.users.teamId,
            workspaceId: schema_1.users.workspaceId,
            workspaceName: schema_1.workspaces.name,
            avatar: schema_1.users.avatar,
            isActive: schema_1.users.isActive,
            emailVerified: schema_1.users.emailVerified,
            phone: schema_1.users.phone,
            lastLoginAt: schema_1.users.lastLoginAt,
            lastLoginIp: schema_1.users.lastLoginIp,
        })
            .from(schema_1.users)
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.users.roleId, schema_1.roles.id))
            .innerJoin(schema_1.workspaces, (0, drizzle_orm_1.eq)(schema_1.users.workspaceId, schema_1.workspaces.id))
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user)
            throw new Error("Invalid email or password");
        if (!user.isActive)
            throw new Error("Account is deactivated.");
        if (!user.emailVerified)
            throw new Error("Please verify your email before logging in.");
        const isValidPassword = await argon2_1.default.verify(user.password, password);
        if (!isValidPassword)
            throw new Error("Invalid email or password");
        // ✅ FIRST: Get user's workspaces
        const userWorkspaces = await drizzle_1.db
            .select({
            workspaceId: schema_1.workspaceMembers.workspaceId,
            workspaceName: schema_1.workspaces.name,
            roleId: schema_1.workspaceMembers.roleId,
            roleName: schema_1.roles.name,
        })
            .from(schema_1.workspaceMembers)
            .innerJoin(schema_1.workspaces, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, schema_1.workspaces.id))
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, user.id));
        const activeWorkspace = userWorkspaces[0];
        // ✅ Get workspace-specific team from workspace_members
        let workspaceTeam = null;
        let workspaceTeamId = null;
        if (activeWorkspace?.workspaceId) {
            const [memberData] = await drizzle_1.db
                .select({ teamId: schema_1.workspaceMembers.teamId })
                .from(schema_1.workspaceMembers)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, user.id), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, activeWorkspace.workspaceId)))
                .limit(1);
            if (memberData?.teamId) {
                workspaceTeamId = memberData.teamId;
                const [teamData] = await drizzle_1.db
                    .select({ name: schema_1.teams.name })
                    .from(schema_1.teams)
                    .where((0, drizzle_orm_1.eq)(schema_1.teams.id, memberData.teamId))
                    .limit(1);
                workspaceTeam = teamData?.name || null;
            }
        }
        console.log("🔵 Login - Workspace team:", workspaceTeam, workspaceTeamId);
        // ✅ THEN: Get permissions using workspace-specific role
        const userWithPerms = await this.getUserWithPermissions(user.id, activeWorkspace?.workspaceId);
        const tokens = (0, jwt_1.generateTokens)({
            userId: user.id,
            email: user.email,
            workspaceId: activeWorkspace?.workspaceId || user.workspaceId,
            roleId: activeWorkspace?.roleId || user.roleId,
        });
        const hashedRefreshToken = await argon2_1.default.hash(tokens.refreshToken);
        await drizzle_1.db
            .update(schema_1.users)
            .set({
            refreshToken: hashedRefreshToken,
            lastLoginAt: new Date(),
            lastLoginIp: ipAddress || null,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        const avatarInitials = user.name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
        // Log activity
        await drizzle_1.db.insert(schema_1.activityLogs).values({
            userId: user.id,
            workspaceId: activeWorkspace?.workspaceId || user.workspaceId,
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
                role: activeWorkspace?.roleName || "",
                team: workspaceTeam || user.team, // ✅ Workspace-specific first, fallback to global
                teamId: workspaceTeamId || user.teamId, // ✅ Workspace-specific first, fallback to global
                phone: user.phone,
                workspaceId: activeWorkspace?.workspaceId || "",
                workspaceName: activeWorkspace?.workspaceName || "",
                workspaces: userWorkspaces,
                activeWorkspaceId: activeWorkspace?.workspaceId || "",
                activeWorkspaceName: activeWorkspace?.workspaceName || "",
                avatar: user.avatar,
                permissions: userWithPerms.permissions,
                avatarInitials,
                emailVerified: user.emailVerified,
                lastLoginAt: user.lastLoginAt?.toISOString(),
                lastLoginIp: user.lastLoginIp,
            },
            tokens: { accessToken: tokens.accessToken },
            refreshToken: tokens.refreshToken,
        };
    }
    /**
     * Forgot password - send reset email
     */
    async forgotPassword(email) {
        const userResult = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            // Return success even if user not found (security)
            return {
                success: true,
                message: "If an account exists with this email, a password reset link has been sent.",
            };
        }
        const resetToken = (0, jwt_1.generateVerificationToken)();
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await drizzle_1.db
            .update(schema_1.users)
            .set({
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires,
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        await emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
        return {
            success: true,
            message: "If an account exists with this email, a password reset link has been sent.",
        };
    }
    /**
     * Reset password
     */
    async resetPassword(token, password) {
        const userResult = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.passwordResetToken, token))
            .limit(1);
        const user = userResult[0];
        if (!user) {
            throw new Error("Invalid or expired reset token");
        }
        if (user.passwordResetExpires && new Date() > user.passwordResetExpires) {
            throw new Error("Reset token has expired. Please request a new one.");
        }
        const hashedPassword = await argon2_1.default.hash(password, {
            type: argon2_1.default.argon2id,
            memoryCost: 19456,
            timeCost: 2,
            parallelism: 1,
        });
        await drizzle_1.db
            .update(schema_1.users)
            .set({
            password: hashedPassword,
            passwordResetToken: null,
            passwordResetExpires: null,
            refreshToken: null, // Invalidate all sessions
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
        return {
            success: true,
            message: "Password reset successfully! You can now log in with your new password.",
        };
    }
    /**
     * Refresh access token
     */
    async refreshToken(refreshToken) {
        const decoded = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const userResult = await drizzle_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, decoded.userId))
            .limit(1);
        const user = userResult[0];
        if (!user || !user.refreshToken) {
            throw new Error("Invalid refresh token");
        }
        const isValid = await argon2_1.default.verify(user.refreshToken, refreshToken);
        if (!isValid) {
            throw new Error("Invalid refresh token");
        }
        // ✅ Get user's workspaces to include in new token
        const userWorkspaces = await drizzle_1.db
            .select({
            workspaceId: schema_1.workspaceMembers.workspaceId,
            roleId: schema_1.workspaceMembers.roleId,
        })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, user.id));
        const activeWorkspace = userWorkspaces[0];
        const tokens = (0, jwt_1.generateTokens)({
            userId: user.id,
            email: user.email,
            workspaceId: activeWorkspace?.workspaceId || user.workspaceId || "",
            roleId: activeWorkspace?.roleId || user.roleId || "",
        });
        return { accessToken: tokens.accessToken };
    }
    /**
     * Logout user
     */
    async logout(userId) {
        await drizzle_1.db
            .update(schema_1.users)
            .set({ refreshToken: null })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
    }
    /**
     * Get user with all permissions
     */
    // src/modules/auth/auth.service.ts
    async getUserWithPermissions(userId, workspaceId, tx) {
        const dbInstance = tx || drizzle_1.db;
        let roleId;
        let roleName;
        let userWorkspaceId;
        // ✅ If workspaceId is provided, get role from workspace_members
        if (workspaceId) {
            const [member] = await dbInstance
                .select({
                roleId: schema_1.workspaceMembers.roleId,
                roleName: schema_1.roles.name,
            })
                .from(schema_1.workspaceMembers)
                .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.roleId, schema_1.roles.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
                .limit(1);
            if (member) {
                roleId = member.roleId;
                roleName = member.roleName;
                userWorkspaceId = workspaceId;
            }
        }
        // ✅ Get user basic info
        const userResult = await dbInstance
            .select({
            id: schema_1.users.id,
            email: schema_1.users.email,
            name: schema_1.users.name,
            roleId: schema_1.users.roleId,
            roleName: schema_1.roles.name,
            team: schema_1.users.team,
            workspaceId: schema_1.users.workspaceId,
            emailVerified: schema_1.users.emailVerified,
        })
            .from(schema_1.users)
            .innerJoin(schema_1.roles, (0, drizzle_orm_1.eq)(schema_1.users.roleId, schema_1.roles.id))
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId));
        const user = userResult[0];
        if (!user) {
            throw new Error("User not found");
        }
        // ✅ Use workspace-specific role if available, otherwise use default
        const effectiveRoleId = roleId || user.roleId;
        const effectiveRoleName = roleName || user.roleName;
        const effectiveWorkspaceId = userWorkspaceId || user.workspaceId;
        console.log("🔵 getUserWithPermissions:", {
            userId,
            workspaceId,
            effectiveRoleId,
            effectiveRoleName,
            hasWorkspaceContext: !!workspaceId,
        });
        // Get role default permissions
        const rolePerms = await dbInstance
            .select({ name: schema_1.permissions.name })
            .from(schema_1.rolePermissions)
            .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
            .where((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, effectiveRoleId));
        // Create Set with explicit string type
        const permissionSet = new Set();
        rolePerms.forEach((p) => {
            permissionSet.add(p.name);
        });
        console.log(`🔵 Role "${effectiveRoleName}" default permissions:`, permissionSet.size);
        // Get user-specific permission overrides
        const overrides = await dbInstance
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
                console.log(`  + Added override: ${override.name}`);
            }
            else if (override.granted === false) {
                permissionSet.delete(override.name);
                console.log(`  - Removed override: ${override.name}`);
            }
        });
        // Cast to string[]
        const permissionsArray = Array.from(permissionSet);
        console.log(`🔵 Final permissions for ${effectiveRoleName}:`, permissionsArray);
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: effectiveRoleName, // ✅ Workspace-specific role name
            team: user.team,
            workspaceId: effectiveWorkspaceId, // ✅ Workspace-specific
            permissions: permissionsArray,
            emailVerified: user.emailVerified,
        };
    }
}
exports.AuthService = AuthService;
