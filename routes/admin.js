import express from "express";
import {
  verifyEmail,
  SendOtpForResetPassword,
  verifyOTPForResetPassword,
  resetPassword,
  addAdmin,
  login,
  getAllAdmins,
  getAdmin,
  update,
} from "../controllers/admin.js";
import { otpRateLimiter } from "../middlewares/rateLimiter.js"; // Import rate limiter
import { restrictTo } from "../middlewares/restrictTo.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/login", login);

router.post("/add-admin", restrictTo("superAdmin", "admin"), addAdmin);

router.put("/update", verifyToken, restrictTo("superAdmin", "admin"), update);

router.get(
  "/get-all-admins",
  verifyToken,
  restrictTo("superAdmin", "admin"),
  getAllAdmins
);

router.get(
  "/get-admin/:adminId",
  verifyToken,
  restrictTo("superAdmin", "admin"),
  getAdmin
);

//  Verify otp to create email
router.post("/verify-otp-for-account-creation", otpRateLimiter, verifyEmail);

//  Send OTP to email for password reset
router.post("/send-otp-for-resetPassword", SendOtpForResetPassword);

//  Verify OTP (for both email verification & password reset)
router.post(
  "/verify-otp-for-resetPassword",
  otpRateLimiter,
  verifyOTPForResetPassword
);

//  Reset password after OTP verification
router.patch("/reset-password/:email", resetPassword);

export const adminRoutes = router;
