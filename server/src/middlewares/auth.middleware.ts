// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AuthService } from "../modules/auth/auth.service";
import { teams, workspaceMembers } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "../db/drizzle";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        workspaceId: string;
        roleId: string;
        role: string; // ✅ Added role name
        permissions: string[];
        emailVerified: boolean;
        teamId?: string | null;
        team?: string | null;
      };
    }
  }
}

const authService = new AuthService();

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "No token provided",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = verifyAccessToken(token);

    // Get workspace from header (frontend sends this after switching)
    const workspaceId =
      (req.headers["x-workspace-id"] as string) || decoded.workspaceId;

    // Get user with permissions for the current workspace
    const userWithPerms = await authService.getUserWithPermissions(
      decoded.userId,
      workspaceId,
    );

    console.log("🔵 Authenticated user:", userWithPerms.name);
    console.log("🔵 Permissions:", userWithPerms.permissions);

    // Get team from workspace_members for the CURRENT workspace
    let userTeamId: string | null = null;
    let userTeam: string | null = null;

    const [memberData] = await db
      .select({ teamId: workspaceMembers.teamId })
      .from(workspaceMembers)
      .where(
        and(
          eq(workspaceMembers.userId, decoded.userId),
          eq(workspaceMembers.workspaceId, workspaceId),
        ),
      )
      .limit(1);

    if (memberData?.teamId) {
      userTeamId = memberData.teamId;

      const [teamData] = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, memberData.teamId))
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
      role: userWithPerms.role, // ✅ Added
      permissions: userWithPerms.permissions,
      emailVerified: userWithPerms.emailVerified ?? false, // ✅ FIXED: nullish coalescing
      teamId: userTeamId,
      team: userTeam,
    };

    next();
  } catch (error: any) {
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

export function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
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

export function requireEmailVerified(
  req: Request,
  res: Response,
  next: NextFunction,
) {
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
