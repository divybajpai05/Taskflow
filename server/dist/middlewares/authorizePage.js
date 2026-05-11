"use strict";
// src/middleware/authorizePage.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizePage = authorizePage;
const drizzle_1 = require("../db/drizzle");
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
/**
 * Middleware to check if user has access to a specific page
 */
function authorizePage(pagePermission) {
    return async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                return res.status(401).json({ error: "Unauthorized" });
            }
            // Admins automatically get access to everything
            if (user.role === "Admin") {
                return next();
            }
            // Check if user's role has the required page permission
            const hasPermission = await checkUserPermission(user.userId, pagePermission);
            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: "You don't have access to this page",
                });
            }
            next();
        }
        catch (error) {
            console.error("Authorization error:", error);
            return res.status(500).json({ error: "Authorization check failed" });
        }
    };
}
/**
 * Check if user has a specific permission (through role or direct assignment)
 */
async function checkUserPermission(userId, permissionName) {
    // Get user's role
    const [user] = await drizzle_1.db
        .select({ roleId: schema_1.users.roleId })
        .from(schema_1.users)
        .where((0, drizzle_orm_1.eq)(schema_1.users.id, userId))
        .limit(1);
    if (!user)
        return false;
    // Check role permissions
    const rolePerm = await drizzle_1.db
        .select()
        .from(schema_1.rolePermissions)
        .innerJoin(schema_1.permissions, (0, drizzle_orm_1.eq)(schema_1.rolePermissions.permissionId, schema_1.permissions.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.rolePermissions.roleId, user.roleId), (0, drizzle_orm_1.eq)(schema_1.permissions.name, permissionName)))
        .limit(1);
    if (rolePerm.length > 0)
        return true;
    // Check direct user permission overrides (if you implement them)
    // This is optional for future use
    return false;
}
