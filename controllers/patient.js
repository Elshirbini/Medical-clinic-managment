import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import redisClient from "../config/redis.js";
import { Appointment, Patient } from "../models/index.js";
import { generateOTP } from "../utils/generateOTP.js";
import { ApiError } from "../utils/apiError.js";
import { sendToWhatsapp } from "../utils/sendToWhatsapp.js";

const OTP_EXPIRATION = 300; // 5 minutes

export const login = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  const patient = await Patient.findOne({ where: { phone: phone } });
  if (!patient) {
    throw new ApiError("This phone number has no account", 403);
  }

  const otp = generateOTP();

  await sendToWhatsapp(phone, "otp", otp);

  await redisClient.setEx(
    otp,
    OTP_EXPIRATION,
    JSON.stringify({ id: patient.patient_id })
  );

  res.status(200).json({ message: "Code sent successfully" });
});

export const signup = asyncHandler(async (req, res, next) => {
  const { name, gender, age, phone } = req.body;

  const isExist = await Patient.findOne({ where: { phone: phone } });
  if (isExist) throw new ApiError("This patient already exists", 403);

  const otp = generateOTP();

  await sendToWhatsapp(phone, "otp", otp);

  const patientData = { name, gender, age, phone };

  await redisClient.setEx(otp, OTP_EXPIRATION, JSON.stringify(patientData));

  res.status(200).json({ message: "Code sent successfully" });
});

export const verifyOTP = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  let patient;
  let id;
  const patientData = await redisClient.get(code);
  if (!patientData) throw new ApiError("Invalid or expired OTP", 404);

  const parsedData = JSON.parse(patientData);

  if (
    parsedData.phone &&
    parsedData.name &&
    parsedData.gender &&
    parsedData.age
  ) {
    patient = await Patient.create(parsedData);
    id = patient.patient_id;
  } else if (parsedData.id) {
    id = parsedData.id;
  }

  const token = jwt.sign({ id: id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: process.env.EXPIRE_JWT_AUTH,
  });

  await redisClient.del(code);

  res.cookie("patientToken", token, {
    expires: new Date(Date.now() + 12 * 60 * 60 * 1000),
    httpOnly: true,
    secure: process.env.NODE_ENV === "prod",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Successfully" });
});
