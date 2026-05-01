// src/middleware/authorizePage.ts

import { Request, Response, NextFunction } from "express";
import { db } from "../db/drizzle";
import { users, roles, rolePermissions, permissions } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Middleware to check if user has access to a specific page
 */
export function authorizePage(pagePermission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Admins automatically get access to everything
      if (user.role === "Admin") {
        return next();
      }

      // Check if user's role has the required page permission
      const hasPermission = await checkUserPermission(
        user.userId,
        pagePermission,
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: "You don't have access to this page",
        });
      }

      next();
    } catch (error) {
      console.error("Authorization error:", error);
      return res.status(500).json({ error: "Authorization check failed" });
    }
  };
}

/**
 * Check if user has a specific permission (through role or direct assignment)
 */
async function checkUserPermission(
  userId: string,
  permissionName: string,
): Promise<boolean> {
  // Get user's role
  const [user] = await db
    .select({ roleId: users.roleId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return false;

  // Check role permissions
  const rolePerm = await db
    .select()
    .from(rolePermissions)
    .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
    .where(
      and(
        eq(rolePermissions.roleId, user.roleId),
        eq(permissions.name, permissionName),
      ),
    )
    .limit(1);

  if (rolePerm.length > 0) return true;

  // Check direct user permission overrides (if you implement them)
  // This is optional for future use

  return false;
}
