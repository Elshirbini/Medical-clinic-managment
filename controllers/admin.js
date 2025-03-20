import bcrypt from "bcryptjs";
import crypto from "crypto";
import asyncHandler from "express-async-handler";
import redisClient from "../config/redis.js";
import { generateOTP } from "../utils/generateOTP.js";
import { sendToEmails } from "../utils/sendToEmails.js";
import { Admin } from "../models/admin.js";

const OTP_EXPIRATION = 300; // 5 minutes

/**
 *  Request OTP for Email Verification (Account Creation or Change)
 */
export const verifyEmail = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const otp = generateOTP();

  await redisClient.setEx(`otp:${email}`, OTP_EXPIRATION, otp);
  await sendToEmails(
    email,
    "Verify Your Email",
    `Your OTP for email verification is: ${otp}`
  );

  res.json({ success: true, message: "OTP sent to email" });
});

/**
 *  Request OTP for Password Reset
 */
export const verifyEmailForResetPass = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const admin = await Admin.findOne({ where: { email } });

  if (!admin) {
    return res.status(404).json({ success: false, message: "Email not found" });
  }

  const otp = generateOTP();
  await redisClient.setEx(`reset-otp:${email}`, OTP_EXPIRATION, otp);
  await sendToEmails(
    email,
    "Reset Password OTP",
    `Your OTP for password reset is: ${otp}`
  );

  res.json({ success: true, message: "OTP sent for password reset" });
});

/**
 *   OTP Verification (For Email and Password Reset)
 */
export const verifyOTP = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const storedOTP =
    (await redisClient.get(`otp:${email}`)) ||
    (await redisClient.get(`reset-otp:${email}`));

  const storedOTPString = String(storedOTP);
  const receivedOTPString = String(otp);

  if (
    Buffer.from(storedOTPString).length !==
      Buffer.from(receivedOTPString).length ||
    !crypto.timingSafeEqual(
      Buffer.from(storedOTPString),
      Buffer.from(receivedOTPString)
    )
  ) {
    await redisClient.del(`otp:${email}`);
    await redisClient.del(`reset-otp:${email}`);
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  await redisClient.del(`otp:${email}`);
  await redisClient.del(`reset-otp:${email}`);

  res.json({ success: true, message: "OTP verified successfully" });
});

/**
 *  Reset Password After OTP Verification
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword, otp } = req.body;
  const storedOTP = await redisClient.get(`reset-otp:${email}`);

  const storedOTPString = String(storedOTP);
  const receivedOTPString = String(otp);

  if (
    Buffer.from(storedOTPString).length !==
      Buffer.from(receivedOTPString).length ||
    !crypto.timingSafeEqual(
      Buffer.from(storedOTPString),
      Buffer.from(receivedOTPString)
    )
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  const admin = await Admin.findOne({ where: { email } });
  if (!admin) {
    return res.status(404).json({ success: false, message: "Email not found" });
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await Admin.update({ password: hashedPassword }, { where: { email } });

  await redisClient.del(`reset-otp:${email}`);
  res.json({ success: true, message: "Password reset successfully" });
});

/**
 * ✅ Request OTP for Email Update
 */
export const requestEmailUpdate = asyncHandler(async (req, res) => {
  const { oldEmail, newEmail } = req.body;

  const existingUser = await Admin.findOne({ where: { email: newEmail } });
  if (existingUser) {
    return res
      .status(400)
      .json({ success: false, message: "Email already in use" });
  }

  const otp = generateOTP();
  await redisClient.setEx(
    `email-change:${oldEmail}`,
    OTP_EXPIRATION,
    JSON.stringify({ otp, newEmail })
  );

  await sendToEmails(
    oldEmail,
    "Confirm Email Change",
    `Your OTP to change email is: ${otp}`
  );

  res.json({ success: true, message: "OTP sent to old email" });
});

/**
 * ✅ Verify OTP and Update Email
 */
export const verifyEmailChange = asyncHandler(async (req, res) => {
  const { oldEmail, otp } = req.body;
  if (!oldEmail || !otp) {
    return res
      .status(400)
      .json({ success: false, message: "Missing email or OTP" });
  }

  const data = await redisClient.get(`email-change:${oldEmail}`);
  if (!data) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  const { otp: storedOTP, newEmail } = JSON.parse(data);

  const storedOTPString = String(storedOTP);
  const receivedOTPString = String(otp);

  if (
    Buffer.from(storedOTPString).length !==
      Buffer.from(receivedOTPString).length ||
    !crypto.timingSafeEqual(
      Buffer.from(storedOTPString),
      Buffer.from(receivedOTPString)
    )
  ) {
    await redisClient.del(`email-change:${oldEmail}`);
    return res
      .status(400)
      .json({ success: false, message: "Invalid or expired OTP" });
  }

  const emailExists = await Admin.findOne({ where: { email: newEmail } });
  if (emailExists) {
    return res
      .status(400)
      .json({ success: false, message: "This email is already in use" });
  }

  await Admin.update({ email: newEmail }, { where: { email: oldEmail } });

  const updatedUser = await Admin.findOne({ where: { email: newEmail } });
  if (!updatedUser) {
    return res
      .status(500)
      .json({ success: false, message: "Email update failed" });
  }

  await redisClient.del(`email-change:${oldEmail}`);
  res.json({ success: true, message: "Email updated successfully" });
});
