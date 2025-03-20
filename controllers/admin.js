import bcrypt from "bcrypt";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendToEmails } from "../utils/sendToEmails.js";
import { Admin } from "../models/admin.js";
import { ApiError } from "../utils/apiError.js"; // Import ApiError

const OTP_EXPIRATION = 300; // 5 minutes

/**
 * ✅ Request OTP for Email Verification (Account Creation or Change)
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { email, password, username, phone, otp } = req.body;

  if (!email || !password || !username || !phone || !otp) {
    return next(new ApiError("All fields are required", 400));
  }

  const storedEmail = await redisClient.get(`verify-otp:${otp}`);

  if (!storedEmail || storedEmail !== email) {
    throw new ApiError("Invalid or expired OTP", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newAdmin = await Admin.create({
    email,
    username,
    phone,
    password: hashedPassword,
  });

  await redisClient.del(`verify-otp:${otp}`);

  res.status(201).json({
    success: true,
    message: "Email verified and admin created successfully",
    admin: newAdmin,
  });
});

/**
 * ✅ Request OTP for Password Reset
 */
export const SendOtpForResetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ where: { email } });

  if (!admin) {
    throw new ApiError("Email not found", 400);
  }

  const otp = generateOTP();
  await redisClient.setEx(`reset-otp:${otp}`, OTP_EXPIRATION, email);

  await sendToEmails(
    email,
    "Reset Password OTP",
    `Your OTP for password reset is: ${otp}`
  );

  res
    .status(201)
    .json({ success: true, message: "OTP sent for password reset" });
});

/**
 * ✅ OTP Verification (For Email and Password Reset) Without Email Input
 */
export const verifyOTPForResetPassword = asyncHandler(async (req, res) => {
  const { otp } = req.body;

  // Get email from OTP key in Redis
  const email = await redisClient.get(`reset-otp:${otp}`);

  if (!email) {
    throw new ApiError("Invalid or expired OTP", 400);
  }

  // Store verification flag in Redis (valid for 5 minutes)
  await redisClient.setEx(`reset-verified:${email}`, 300, true);

  // Delete OTP from Redis
  await redisClient.del(`reset-otp:${otp}`);

  res
    .status(201)
    .json({ success: true, message: "OTP verified successfully", email });
});

/**
 * ✅ Reset Password After OTP Verification
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  // Check if OTP was verified
  const isVerified = await redisClient.get(`reset-verified:${email}`);
  if (!isVerified) {
    throw new ApiError("OTP verification required", 400);
  }

  // Find admin
  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    throw new ApiError("Email not found", 400);
  }

  // Hash and update password
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await Admin.update({ password: hashedPassword }, { where: { email } });

  // Delete verification flag from Redis
  await redisClient.del(`reset-verified:${email}`);

  res
    .status(201)
    .json({ success: true, message: "Password reset successfully" });
});

/**
 * ✅ Request OTP for Email Update
 */
// export const requestEmailUpdate = asyncHandler(async (req, res) => {
//   const { oldEmail, newEmail } = req.body;

//   const existingUser = await Admin.findOne({ where: { email: newEmail } });
//   if (existingUser) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Email already in use" });
//   }

//   const otp = generateOTP();
//   await redisClient.setEx(
//     `email-change:${otp}`,
//     OTP_EXPIRATION,
//     JSON.stringify({ oldEmail, newEmail })
//   );

//   await sendToEmails(
//     oldEmail,
//     "Confirm Email Change",
//     `Your OTP to change email is: ${otp}`
//   );

//   res.json({ success: true, message: "OTP sent to old email" });
// });

// /**
//  * ✅ Verify OTP and Update Email
//  */
// export const verifyEmailChange = asyncHandler(async (req, res) => {
//   const { otp } = req.body;
//   if (!otp) {
//     return res.status(400).json({ success: false, message: "Missing OTP" });
//   }

//   const data = await redisClient.get(`email-change:${otp}`);
//   if (!data) {
//     return res
//       .status(400)
//       .json({ success: false, message: "Invalid or expired OTP" });
//   }

//   const { oldEmail, newEmail } = JSON.parse(data);

//   const emailExists = await Admin.findOne({ where: { email: newEmail } });
//   if (emailExists) {
//     return res
//       .status(400)
//       .json({ success: false, message: "This email is already in use" });
//   }

//   await Admin.update({ email: newEmail }, { where: { email: oldEmail } });

//   const updatedUser = await Admin.findOne({ where: { email: newEmail } });
//   if (!updatedUser) {
//     return res
//       .status(500)
//       .json({ success: false, message: "Email update failed" });
//   }

//   await redisClient.del(`email-change:${otp}`);
//   res.json({ success: true, message: "Email updated successfully" });
// });
