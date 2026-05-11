"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const config_1 = require("../../config");
const authService = new auth_service_1.AuthService();
class AuthController {
    async register(req, res, next) {
        try {
            const input = req.body;
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await authService.register(input, ipAddress);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: config_1.config.cookies.httpOnly,
                secure: config_1.config.cookies.secure,
                sameSite: config_1.config.cookies.sameSite,
                maxAge: 15 * 24 * 60 * 60 * 1000,
            });
            res.status(201).json({
                success: true,
                message: result.message,
                data: {
                    user: result.user,
                    accessToken: result.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async verifyEmail(req, res, next) {
        try {
            const { token } = req.body;
            const result = await authService.verifyEmail(token);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resendVerification(req, res, next) {
        try {
            const { email } = req.body;
            const result = await authService.resendVerificationEmail(email);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async login(req, res, next) {
        try {
            const input = req.body;
            const ipAddress = req.ip || req.socket.remoteAddress;
            const result = await authService.login(input, ipAddress);
            res.cookie("refreshToken", result.refreshToken, {
                httpOnly: config_1.config.cookies.httpOnly,
                secure: config_1.config.cookies.secure,
                sameSite: config_1.config.cookies.sameSite,
                maxAge: 15 * 24 * 60 * 60 * 1000,
            });
            res.json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                },
            });
        }
        catch (error) {
            next(error);
        }
    }
    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            const result = await authService.forgotPassword(email);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async resetPassword(req, res, next) {
        try {
            const { token, password } = req.body;
            const result = await authService.resetPassword(token, password);
            res.json({
                success: true,
                message: result.message,
            });
        }
        catch (error) {
            next(error);
        }
    }
    async refreshToken(req, res, next) {
        try {
            // ✅ Check if cookies exist BEFORE accessing
            if (!req.cookies || !req.cookies.refreshToken) {
                console.log("🔴 No refresh token cookie found");
                return res.status(401).json({
                    success: false,
                    error: "No refresh token provided",
                });
            }
            const refreshToken = req.cookies.refreshToken;
            console.log("🔵 Refresh token found, processing...");
            const result = await authService.refreshToken(refreshToken);
            res.json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            console.error("🔴 Refresh error:", error.message);
            // Handle specific errors gracefully
            if (error.message?.includes("Invalid") ||
                error.message?.includes("expired")) {
                return res.status(401).json({
                    success: false,
                    error: error.message,
                });
            }
            return res.status(401).json({
                success: false,
                error: "Token refresh failed",
            });
        }
    }
    async logout(req, res, next) {
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
        }
        catch (error) {
            next(error);
        }
    }
    async me(req, res, next) {
        try {
            const userWithPerms = await authService.getUserWithPermissions(req.user.id);
            res.json({
                success: true,
                data: userWithPerms,
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.AuthController = AuthController;
