import asyncHandler from "express-async-handler";
import { Appointment, Patient } from "../models/index.js";
import { generateOTP } from "../utils/generateOTP.js";
import { ApiError } from "../utils/apiError.js";
import redisClient from "../config/redis.js";
import jwt from "jsonwebtoken";
import { sendToWhatsapp } from "../utils/sendToWhatsapp.js";

export const login = asyncHandler(async (req, res, next) => {
  const { phone } = req.body;

  const patient = await Patient.findOne({ where: { phone: phone } });
  if (!patient) {
    throw new ApiError("This phone number has no account", 403);
  }

  const otp = generateOTP();
  
  await sendToWhatsapp(phone, "otp", otp);

  await redisClient.setEx(otp, 600, JSON.stringify({ id: patient.patient_id }));

  res.status(200).json({ message: "Code sent successfully" });
});

export const signup = asyncHandler(async (req, res, next) => {
  const { name, gender, age, phone } = req.body;

  const isExist = await Patient.findOne({ where: { phone: phone } });
  if (isExist) throw new ApiError("This patient is already exists", 403);

  const otp = generateOTP();

  await sendToWhatsapp(phone, "otp", otp);

  const patientData = { name, gender, age, phone };

  await redisClient.setEx(otp, 360, JSON.stringify(patientData));

  res.status(200).json({ message: "Code sent successfully" });
});

export const verifyOTP = asyncHandler(async (req, res, next) => {
  const { code } = req.body;
  let patient;
  let id;
  console.log(id)
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

export const getPatientAppointments = asyncHandler(async (req, res, next) => {
  const { patientId } = req.params;

  const patient = await Patient.findByPk(patientId);

  const appointments = await Appointment.findAll({
    where: { patient_id: patient.patient_id },
    order: [["createdAt", "ASC"]],
  });

  if (!appointments || appointments.length === 0) {
    throw new ApiError("No appointments found", 404);
  }

  res.status(200).json({ appointments });
});
