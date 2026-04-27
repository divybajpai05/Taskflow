// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { AuthService } from "../modules/auth/auth.service";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        workspaceId: string;
        roleId: string;
        permissions: string[];
        emailVerified: boolean;
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

        const workspaceId =
          (req.headers["x-workspace-id"] as string) || decoded.workspaceId;


    const userWithPerms = await authService.getUserWithPermissions(
      decoded.userId,
    );

     console.log("🔵 Authenticated user:", userWithPerms.name);
     console.log("🔵 Permissions:", userWithPerms.permissions);

    req.user = {
      id: userWithPerms.id,
      email: userWithPerms.email,
      workspaceId: workspaceId,
      roleId: decoded.roleId,
      permissions: userWithPerms.permissions,
      emailVerified: userWithPerms.emailVerified,
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
