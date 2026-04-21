// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from "express";
import { AuthService } from "./auth.service";
import { RegisterInput, LoginInput } from "./auth.types";
import { config } from "../../config";

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const input: RegisterInput = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.register(input, ipAddress);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: config.cookies.httpOnly,
        secure: config.cookies.secure,
        sameSite: config.cookies.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          user: result.user,
          accessToken: result.accessToken,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.body;
      const result = await authService.verifyEmail(token);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.resendVerificationEmail(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const input: LoginInput = req.body;
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await authService.login(input, ipAddress);

      res.cookie("refreshToken", result.refreshToken, {
        httpOnly: config.cookies.httpOnly,
        secure: config.cookies.secure,
        sameSite: config.cookies.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          user: result.user,
          accessToken: result.tokens.accessToken,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      const result = await authService.forgotPassword(email);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;
      const result = await authService.resetPassword(token, password);

      res.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          error: "No refresh token provided",
        });
      }

      const result = await authService.refreshToken(refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;

      if (userId) {
        await authService.logout(userId);
      }

      res.clearCookie("refreshToken");

      res.json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error: any) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const userWithPerms = await authService.getUserWithPermissions(
        req.user!.id,
      );

      res.json({
        success: true,
        data: userWithPerms,
      });
    } catch (error: any) {
      next(error);
    }
  }
}
