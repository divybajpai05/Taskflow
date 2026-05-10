// src/utils/getIp.ts
import { Request } from "express";

export function getClientIp(req: Request): string {
  // Check x-forwarded-for (production behind proxy)
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const forwardedStr = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return forwardedStr.split(",")[0].trim();
  }

  // Check x-real-ip (Nginx)
  const realIp = req.headers["x-real-ip"];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0] : realIp;
  }

  // Fallback to direct connection
  return req.ip || req.socket.remoteAddress || "127.0.0.1";
}
