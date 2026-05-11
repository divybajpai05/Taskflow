"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generatePasswordResetToken = exports.generateVerificationTokenJWT = exports.generateVerificationToken = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
// src/utils/jwt.ts
const jwt = __importStar(require("jsonwebtoken"));
const crypto = __importStar(require("crypto"));
const config_1 = require("../config");
const generateTokens = (payload) => {
    const accessToken = jwt.sign(payload, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.accessExpiry,
    });
    const refreshToken = jwt.sign({ userId: payload.userId }, config_1.config.jwt.refreshSecret, {
        expiresIn: config_1.config.jwt.refreshExpiry,
    });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    return jwt.verify(token, config_1.config.jwt.secret);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jwt.verify(token, config_1.config.jwt.refreshSecret);
};
exports.verifyRefreshToken = verifyRefreshToken;
/**
 * Generate a short, URL-safe verification token
 * Uses crypto.randomBytes instead of JWT to avoid length issues
 * Returns a 64-character hex string
 */
const generateVerificationToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
exports.generateVerificationToken = generateVerificationToken;
/**
 * Alternative: Generate a shorter JWT token (if you prefer to keep JWT)
 * This creates a minimal JWT without expiration in the payload
 */
const generateVerificationTokenJWT = () => {
    return jwt.sign({ purpose: "email_verification" }, config_1.config.jwt.secret, {
        expiresIn: config_1.config.jwt.refreshExpiry,
        // No extra data to keep it shorter
    });
};
exports.generateVerificationTokenJWT = generateVerificationTokenJWT;
/**
 * Generate a password reset token (same format as verification)
 */
const generatePasswordResetToken = () => {
    return crypto.randomBytes(32).toString("hex");
};
exports.generatePasswordResetToken = generatePasswordResetToken;
