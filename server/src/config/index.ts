// src/config/index.ts
import "dotenv/config";

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  backendUrl: process.env.BACKEND_URL || "http://localhost:3000",

  jwt: {
    secret: process.env.JWT_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },

  brevo: {
    apiKey: process.env.BREVO_API_KEY!,
    senderEmail: process.env.BREVO_SENDER_EMAIL || "noreply@taskflow.com",
    senderName: process.env.BREVO_SENDER_NAME || "Taskflow",
  },

  cookies: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    httpOnly: true,
  },

  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
  },
};

// Validate required env vars
const requiredEnvVars = [
  "JWT_SECRET",
  "JWT_REFRESH_SECRET",
  "DATABASE_URL",
  "BREVO_API_KEY",
];
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
});
