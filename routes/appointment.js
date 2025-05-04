import express from "express";
import { verifyToken } from "../middlewares/verifyToken.js";
import {
  addAvailableAppointments,
  bookAppointment,
  cancelAppointment,
  getAvailableAppointments,
  getPatientAppointments,
} from "../controllers/appointment.js";

const router = express.Router();

router.get(
  "/get-patient-appointments/:patientId",
  verifyToken,
  getPatientAppointments
);

router.post(
  "/add-available-appointments",
  verifyToken,
  addAvailableAppointments
);

router.get(
  "/get-available-appointments/:date",
  verifyToken,
  getAvailableAppointments
);

router.delete(
  "/cancel-appointment/:appointmentId",
  verifyToken,
  cancelAppointment
);

router.post("/book-appointment/:patientId", verifyToken, bookAppointment);

export const appointmentsRoutes = router;
