"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/modules/auth/auth.routes.ts
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const validation_middleware_1 = require("../../middlewares/validation.middleware");
const auth_validation_1 = require("./auth.validation");
const auth_middleware_1 = require("../../middlewares/auth.middleware");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const authController = new auth_controller_1.AuthController();
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many attempts, please try again later",
});
// Public routes
router.post("/register", authLimiter, (0, validation_middleware_1.validateRequest)(auth_validation_1.registerSchema), authController.register);
router.post("/verify-email", (0, validation_middleware_1.validateRequest)(auth_validation_1.verifyEmailSchema), authController.verifyEmail);
router.post("/resend-verification", authLimiter, authController.resendVerification);
router.post("/login", authLimiter, (0, validation_middleware_1.validateRequest)(auth_validation_1.loginSchema), authController.login);
router.post("/forgot-password", authLimiter, (0, validation_middleware_1.validateRequest)(auth_validation_1.forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", (0, validation_middleware_1.validateRequest)(auth_validation_1.resetPasswordSchema), authController.resetPassword);
router.post("/refresh", authController.refreshToken);
// Protected routes
router.post("/logout", auth_middleware_1.authenticate, authController.logout);
router.get("/me", auth_middleware_1.authenticate, authController.me);
exports.default = router;
