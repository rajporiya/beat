import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { asyncHandler, fail } from "../utils/api.js";
const JWT_SECRET = process.env.JWT_SECRET || "beat_music_super_secure_jwt_secret_key_2026_spotify_clone";
const tokenFor = (req) => req.cookies?.token || req.headers.authorization?.replace(/^Bearer\s+/i, "");
export const requireAuth = asyncHandler(async (req, _res, next) => { const token = tokenFor(req); if (!token) throw fail(401, "Authentication required"); const payload = jwt.verify(token, JWT_SECRET); const user = await User.findById(payload.sub || payload.id).select("-password"); if (!user) throw fail(401, "Account no longer exists"); req.user = user; next(); });
export const optionalAuth = asyncHandler(async (req, _res, next) => { const token = tokenFor(req); if (!token) return next(); try { const payload = jwt.verify(token, JWT_SECRET); const user = await User.findById(payload.sub || payload.id).select("-password"); if (user) req.user = user; } catch { /* anonymous request */ } next(); });
export const requireAdmin = (req, _res, next) => { if (req.user?.role !== "admin") return next(fail(403, "Administrator access required")); next(); };
