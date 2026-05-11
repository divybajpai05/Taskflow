"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClientIp = getClientIp;
function getClientIp(req) {
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
