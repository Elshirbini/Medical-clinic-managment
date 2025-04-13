import asyncHandler from "express-async-handler";
import { Appointment, Patient } from "../models/index.js";
import { convertTo24Hour } from "../utils/convertHoursFormat.js";
import { ApiError } from "../utils/apiError.js";
import { sendToWhatsapp } from "../utils/sendToWhatsapp.js";
import { getIO } from "../socket.js";

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

export const bookAppointment = asyncHandler(async (req, res, next) => {
  const { date, time } = req.body;
  const { patientId } = req.params;

  const isExist = await Appointment.findOne({
    where: { date: date, time: time, status: "scheduled" },
  });
  if (isExist) throw new ApiError("This appointment is scheduled", 403);

  const dateNow = new Date();
  dateNow.setHours(dateNow.getHours() + 2);

  const convertedTime = convertTo24Hour(time);
  const selectedDate = new Date(`${date}T${convertedTime}:00Z`);

  if (dateNow > selectedDate) throw new ApiError("Time is left", 403);

  const appointment = await Appointment.create({
    patient_id: patientId,
    date,
    time,
    status: "scheduled",
  });

  const io = getIO();

  io.to("admins").emit("new-booking", {
    message: "new booking",
    date,
    time,
  });

  res
    .status(201)
    .json({ message: "Appointment booked successfully", appointment });
});
