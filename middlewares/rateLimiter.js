import rateLimit from "express-rate-limit";

/**
 * Rate limit middleware for OTP requests
 * Allows 3 requests per 10 minutes per IP
 */
export const otpRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 3, // Limit each IP to 3 requests per window
  message: {
    success: false,
    message: "Too many OTP requests, try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
