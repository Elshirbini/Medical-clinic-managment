import bcrypt from "bcrypt";
import asyncHandler from "express-async-handler";
import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendToEmails } from "../utils/sendToEmails.js";
import { Admin } from "../models/admin.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const OTP_EXPIRATION = 300; // 5 minutes

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ where: { email: email } });
  if (!admin) throw new ApiError("This email has no account", 401);

  const isPassTrue = await bcrypt.compare(password, admin.password);
  if (!isPassTrue) throw new ApiError("Wrong password", 403);

  const token = jwt.sign(
    { id: admin.admin_id, role: admin.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.EXPIRE_JWT_AUTH }
  );

  res.cookie("adminToken", token, {
    expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "prod",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Login successfully" });
});

export const addAdmin = asyncHandler(async (req, res, next) => {
  const { email, phone, userName, password } = req.body;

  const isExist = await Admin.findOne({ where: { email: email } });
  if (isExist) throw new ApiError("This account is already exist", 401);

  const otp = generateOTP();

  sendToEmails(
    email,
    "Verify your email",
    `Paste Your Verification code ${otp} \n\nThis Verification code will be valid for 5 min`
  );

  const userData = { email, phone, userName, password };

  await redisClient.setEx(
    `verifyEmail-otp:${otp}`,
    OTP_EXPIRATION,
    JSON.stringify(userData)
  );

  res.status(200).json({ message: "OTP sent successfully" });
});

export const updateAdmin = asyncHandler(async (req, res, next) => {});

export const getAllAdmins = asyncHandler(async (req, res, next) => {
  const role = req.userRole;
  let query = {};

  if (role !== "superAdmin") {
    query = { role: { [Op.ne]: "superAdmin" } };
  }

  const admins = await Admin.findAll({
    where: query,
    order: [["createdAt", "DESC"]],
  });

  res.status(200).json({ admins });
});

export const getAdmin = asyncHandler(async (req, res, next) => {
  const { adminId } = req.params;
  const role = req.userRole;

  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new ApiError("Admin not found", 404);

  if (role !== "superAdmin" && admin.role === "superAdmin") {
    throw new ApiError("You don't have the permissions to do this action", 403);
  }
  res.status(200).json({ admin });
});

export const deleteAdmin = asyncHandler(async (req, res, next) => {
  const { adminId } = req.params;

  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new ApiError("Admin not found", 404);

  await admin.destroy();

  res.status(200).json({ message: "Admin deleted successfully" });
});
/**
 * ✅ Request OTP for Email Verification (Account Creation or Change)
 */
export const verifyEmail = asyncHandler(async (req, res, next) => {
  const { otp } = req.body;

  const otpData = await redisClient.get(`verifyEmail-otp:${otp}`);

  if (!otpData) {
    throw new ApiError("Invalid or expired OTP", 400);
  }

  // Parse the stored JSON string into an object
  const { email, phone, userName, password } = JSON.parse(otpData);

  if (!email || !phone || !userName || !password) {
    throw new ApiError("Incomplete OTP data", 400);
  }
  const hashedPassword = await bcrypt.hash(password, 12);

  await Admin.create({
    email,
    userName,
    phone,
    password: hashedPassword,
  });

  await redisClient.del(`verifyEmail-otp:${otp}`);

  res.status(201).json({
    success: true,
    message: "Email verified and admin created successfully",
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

  sendToEmails(
    email,
    "Reset Password OTP",
    `Your OTP for password reset is: ${otp}`
  );

  res
    .status(200)
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
    .status(200)
    .json({ success: true, message: "OTP verified successfully", email });
});

/**
 * ✅ Reset Password After OTP Verification
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { ConfirmePassword, newPassword } = req.body;
  const { email } = req.params;
  if (ConfirmePassword !== newPassword) {
    throw new ApiError("password dosent match", 400);
  }
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
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await Admin.update({ password: hashedPassword }, { where: { email } });

  // Delete verification flag from Redis
  await redisClient.del(`reset-verified:${email}`);

  res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
});
