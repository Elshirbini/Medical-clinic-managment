import express from "express";
import {
  verifyEmail,
  verifyEmailForResetPass,
  verifyOTP,
  resetPassword,
  requestEmailUpdate,
  verifyEmailChange,
} from "../controllers/admin.js";
import { otpRateLimiter } from "../middlewares/rateLimiter.js"; // Import rate limiter

const route = express.Router();

//  Verify email for account creation or email change
route.post("/verify-email", otpRateLimiter, verifyEmail);

//  Request OTP for password reset
route.post("/verify-reset-password", otpRateLimiter, verifyEmailForResetPass);

//  Verify OTP (for both email verification & password reset)
route.post("/verify-otp", verifyOTP);

//  Reset password after OTP verification
route.post("/reset-password", resetPassword);

//  Request OTP for changing email
route.post("/request-email-update", otpRateLimiter, requestEmailUpdate);

//  Verify OTP & update email
route.post("/verify-email-change", verifyEmailChange);

export const adminRoutes = route;
