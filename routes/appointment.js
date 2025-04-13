import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  bookAppointment,
  getPatientAppointments,
} from "../controllers/appointment.js";

const router = express.Router();

router.get(
  "/get-patient-appointments/:patientId",
  verifyToken,
  getPatientAppointments
);

router.post("/book-appointment/:patientId", verifyToken, bookAppointment);

export const appointmentsRoutes = router;
