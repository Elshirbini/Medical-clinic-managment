import { compare, hash } from "bcrypt";
import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendToEmails } from "../utils/sendToEmails.js";
import { Admin } from "../models/index.js";
import { ApiError } from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const OTP_EXPIRATION = 300; // 5 minutes

export const login = async (req, res) => {
  const { email, password } = req.body;

  const admin = await Admin.findOne({ where: { email: email } });
  if (!admin) throw new ApiError("This email has no account", 401);

  const isPassTrue = await compare(password, admin.password);
  if (!isPassTrue) throw new ApiError("Wrong password", 403);

  const token = await new Promise((resolve, reject) => {
    jwt.sign(
      { id: admin.admin_id, role: admin.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.EXPIRE_JWT_AUTH },
      (err, token) => {
        if (err) return reject(new ApiError("Error in signing token", 501));
        resolve(token);
      }
    );
  });

  res.cookie("adminToken", token, {
    expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "prod",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Login successfully" });
};

export const addAdmin = async (req, res) => {
  const { email, phone, userName, password } = req.body;

  const isExist = await Admin.findOne({ where: { email: email } });
  if (isExist) throw new ApiError("This account already exists", 401);

  const otp = generateOTP();

  await sendToEmails(
    email,
    "🔐 Your OTP Code",
    `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333;">👋 Welcome to My App</h2>
      <p style="font-size: 16px;">Use the following OTP to complete your verification process:</p>
      <div style="font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0;">${otp}</div>
      <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #aaa;">If you did not request this code, please ignore this email.</p>
    </div>
  `
  );

  const userData = { email, phone, userName, password };

  await redisClient.setEx(
    `verifyEmail-otp:${otp}`,
    OTP_EXPIRATION,
    JSON.stringify(userData)
  );

  res.status(200).json({ message: "OTP sent successfully" });
};

export const updateAdmin = async (req, res) => {};

export const getAllAdmins = async (req, res) => {
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
};

export const getAdmin = async (req, res) => {
  const { adminId } = req.params;
  const role = req.userRole;

  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new ApiError("Admin not found", 404);

  if (role !== "superAdmin" && admin.role === "superAdmin") {
    throw new ApiError("You don't have the permissions to do this action", 403);
  }
  res.status(200).json({ admin });
};

export const deleteAdmin = async (req, res) => {
  const { adminId } = req.params;

  const admin = await Admin.findByPk(adminId);
  if (!admin) throw new ApiError("Admin not found", 404);

  await admin.destroy();

  res.status(200).json({ message: "Admin deleted successfully" });
};

export const verifyEmail = async (req, res) => {
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
  const hashedPassword = await hash(password, 12);

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
};

export const SendOtpForResetPassword = async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ where: { email } });

  if (!admin) throw new ApiError("Admin not found", 400);

  const otp = generateOTP();
  await redisClient.setEx(`reset-otp:${otp}`, OTP_EXPIRATION, email);

  await sendToEmails(
    email,
    "🔐 Your OTP Code",
    `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h2 style="color: #333;">👋 Welcome to My App</h2>
      <p style="font-size: 16px;">Use the following OTP to complete your verification process:</p>
      <div style="font-size: 24px; font-weight: bold; color: #007bff; margin: 20px 0;">${otp}</div>
      <p style="font-size: 14px; color: #666;">This OTP is valid for 5 minutes. Please do not share it with anyone.</p>
      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #aaa;">If you did not request this code, please ignore this email.</p>
    </div>
  `
  );

  res
    .status(200)
    .json({ success: true, message: "OTP sent for password reset" });
};

export const verifyOTPForResetPassword = async (req, res) => {
  const { otp } = req.body;

  const email = await redisClient.get(`reset-otp:${otp}`);

  if (!email) throw new ApiError("Invalid or expired OTP", 400);

  await redisClient.setEx(`reset-verified:${email}`, 300, "true");

  await redisClient.del(`reset-otp:${otp}`);

  res
    .status(200)
    .json({ success: true, message: "OTP verified successfully", email });
};

export const resetPassword = async (req, res) => {
  const { ConfirmPassword, newPassword } = req.body;
  const { email } = req.params;

  if (ConfirmPassword !== newPassword) {
    throw new ApiError("Password doesn't match", 400);
  }

  const isVerified = await redisClient.get(`reset-verified:${email}`);
  if (isVerified !== "true") {
    throw new ApiError("OTP verification required", 400);
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) throw new ApiError("Admin not found", 400);

  const hashedPassword = await hash(newPassword, 12);
  await Admin.update({ password: hashedPassword }, { where: { email } });

  await redisClient.del(`reset-verified:${email}`);

  res
    .status(200)
    .json({ success: true, message: "Password reset successfully" });
};
