"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requirePermission = requirePermission;
exports.requireEmailVerified = requireEmailVerified;
const jwt_1 = require("../utils/jwt");
const auth_service_1 = require("../modules/auth/auth.service");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_1 = require("../db/drizzle");
const authService = new auth_service_1.AuthService();
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                error: "No token provided",
            });
        }
        const token = authHeader.replace("Bearer ", "");
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        // ✅ Get workspace from header (frontend sends this after switching)
        const workspaceId = req.headers["x-workspace-id"] || decoded.workspaceId;
        // ✅ Get user with permissions for the current workspace
        const userWithPerms = await authService.getUserWithPermissions(decoded.userId, workspaceId);
        console.log("🔵 Authenticated user:", userWithPerms.name);
        console.log("🔵 Permissions:", userWithPerms.permissions);
        // ✅ Get team from workspace_members for the CURRENT workspace
        let userTeamId = null;
        let userTeam = null;
        const [memberData] = await drizzle_1.db
            .select({ teamId: schema_1.workspaceMembers.teamId })
            .from(schema_1.workspaceMembers)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.workspaceMembers.userId, decoded.userId), (0, drizzle_orm_1.eq)(schema_1.workspaceMembers.workspaceId, workspaceId)))
            .limit(1);
        if (memberData?.teamId) {
            userTeamId = memberData.teamId;
            // ✅ Get team name from teams table
            const [teamData] = await drizzle_1.db
                .select({ name: schema_1.teams.name })
                .from(schema_1.teams)
                .where((0, drizzle_orm_1.eq)(schema_1.teams.id, memberData.teamId))
                .limit(1);
            userTeam = teamData?.name || null;
        }
        console.log("🔵 User teamId:", userTeamId);
        console.log("🔵 User team:", userTeam);
        req.user = {
            id: userWithPerms.id,
            email: userWithPerms.email,
            workspaceId: workspaceId,
            roleId: decoded.roleId,
            permissions: userWithPerms.permissions,
            emailVerified: userWithPerms.emailVerified,
            teamId: userTeamId, // ✅ Workspace-specific team ID
            team: userTeam, // ✅ Workspace-specific team name
        };
        next();
    }
    catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                error: "Token expired",
                code: "TOKEN_EXPIRED",
            });
        }
        return res.status(401).json({
            success: false,
            error: "Invalid token",
        });
    }
}
function requirePermission(permission) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: "Unauthorized" });
        }
        if (!req.user.permissions.includes(permission)) {
            console.log(`🔴 Permission denied: missing "${permission}"`);
            console.log(`🔴 User has:`, req.user.permissions);
            return res.status(403).json({
                success: false,
                error: "Forbidden",
                message: `You don't have permission: ${permission}`,
            });
        }
        next();
    };
}
function requireEmailVerified(req, res, next) {
    if (!req.user) {
        return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    if (!req.user.emailVerified) {
        return res.status(403).json({
            success: false,
            error: "Email not verified",
            message: "Please verify your email to access this resource",
        });
    }
    next();
}
