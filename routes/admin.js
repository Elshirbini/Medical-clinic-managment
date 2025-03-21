import express from "express";
import {
  verifyEmail,
  SendOtpForResetPassword,
  verifyOTPForResetPassword,
  resetPassword,
  requestEmailUpdate,
  verifyEmailChange,
} from "../controllers/admin.js";
import { otpRateLimiter } from "../middlewares/rateLimiter.js"; // Import rate limiter

const route = express.Router();

//  Verify otp to create email
route.post("/verify-email", verifyEmail);

//  Send OTP to email for password reset
route.post(
  "/Send-otp-for-resetPassword",
  otpRateLimiter,
  SendOtpForResetPassword
);

//  Verify OTP (for both email verification & password reset)
route.post("/verify-otp-for-resetPassword", verifyOTPForResetPassword);

//  Reset password after OTP verification
route.patch("/reset-password/:email", resetPassword);

// //  Request OTP for changing email
// route.post("/request-email-update", otpRateLimiter, requestEmailUpdate);

// //  Verify OTP & update email
// route.post("/verify-email-change", verifyEmailChange);

export const adminRoutes = route;
