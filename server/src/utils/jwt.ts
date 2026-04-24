// src/utils/jwt.ts
import * as jwt from "jsonwebtoken";
import * as crypto from "crypto";
import { config } from "../config";

export interface TokenPayload {
  userId: string;
  email: string;
  workspaceId: string;
  roleId: string;
}

export interface RefreshTokenPayload {
  userId: string;
}

export const generateTokens = (payload: TokenPayload) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.accessExpiry,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(
    { userId: payload.userId },
    config.jwt.refreshSecret,
    {
      expiresIn: config.jwt.refreshExpiry,
    } as jwt.SignOptions,
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, config.jwt.secret) as TokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
};

/**
 * Generate a short, URL-safe verification token
 * Uses crypto.randomBytes instead of JWT to avoid length issues
 * Returns a 64-character hex string
 */
export const generateVerificationToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};

/**
 * Alternative: Generate a shorter JWT token (if you prefer to keep JWT)
 * This creates a minimal JWT without expiration in the payload
 */
export const generateVerificationTokenJWT = (): string => {
  return jwt.sign({ purpose: "email_verification" }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpiry,
    // No extra data to keep it shorter
  } as jwt.SignOptions);
};

/**
 * Generate a password reset token (same format as verification)
 */
export const generatePasswordResetToken = (): string => {
  return crypto.randomBytes(32).toString("hex");
};
