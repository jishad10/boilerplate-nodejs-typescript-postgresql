import rateLimit, { RateLimitRequestHandler, ipKeyGenerator } from "express-rate-limit";
import { Request } from "express";
import config from "../core/config/config";


export const globalLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: Number(config.limit.RATE_LIMIT_WINDOW) || 15 * 60 * 1000,
  max: Number(config.limit.RATE_LIMIT_MAX) || 100,
});


export const emailVerificationLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,

  // Key by email when present so each address gets its own bucket.
  // Falls back to ipKeyGenerator which handles IPv4/IPv6 normalisation
  // correctly — required by express-rate-limit v8 to avoid ERR_ERL_KEY_GEN_IPV6.
  keyGenerator: (req: Request): string => {
    if (req.body?.email && typeof req.body.email === "string") {
      return req.body.email.toLowerCase().trim();
    }
    return ipKeyGenerator(req.ip ?? "");
  },

  handler: (req, res) => {
    res.status(429).json({
      status: false,
      message: "Too many requests, please try again later.",
    });
  },
});