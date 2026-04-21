// src/modules/auth/auth.routes.ts
import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middlewares/validation.middleware";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./auth.validation";
import { authenticate } from "../../middlewares/auth.middleware";
import rateLimit from "express-rate-limit";

const router = Router();
const authController = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, please try again later",
});

// Public routes
router.post(
  "/register",
  authLimiter,
  validateRequest(registerSchema),
  authController.register,
);
router.post(
  "/verify-email",
  validateRequest(verifyEmailSchema),
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  authLimiter,
  authController.resendVerification,
);
router.post(
  "/login",
  authLimiter,
  validateRequest(loginSchema),
  authController.login,
);
router.post(
  "/forgot-password",
  authLimiter,
  validateRequest(forgotPasswordSchema),
  authController.forgotPassword,
);
router.post(
  "/reset-password",
  validateRequest(resetPasswordSchema),
  authController.resetPassword,
);
router.post("/refresh", authController.refreshToken);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/me", authenticate, authController.me);

export default router;
