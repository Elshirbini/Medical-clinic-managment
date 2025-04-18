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
  deleteAdmin,
  updateAdmin,
} from "../controllers/admin.js";
import { otpRateLimiter } from "../middlewares/rateLimiter.js";
import { restrictTo } from "../middlewares/restrictTo.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

router.post("/login", login);

router.post(
  "/add-admin",
  verifyToken,
  restrictTo("superAdmin", "admin"),
  addAdmin
);

router.put(
  "/update-admin",
  verifyToken,
  restrictTo("superAdmin", "admin"),
  updateAdmin
);

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

router.delete(
  "/delete-admin/:adminId",
  verifyToken,
  restrictTo("superAdmin"),
  deleteAdmin
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
