import express from "express";
import {
  getPatientAppointments,
  login,
  signup,
  verifyOTP,
} from "../controllers/patient.js";
import { verifyToken } from "../middlewares/verifyToken.js";

const route = express.Router();

route.post("/login", login);
route.post("/signup", signup);
route.post("/verify-otp", verifyOTP);
route.get(
  "/get-patient-appointments/:patientId",
  verifyToken,
  getPatientAppointments
);

export const patientRoutes = route;
