import { Appointment, Patient } from "../models/index.js";
import { convertTo24Hour } from "../utils/convertHoursFormat.js";
import { ApiError } from "../utils/apiError.js";
import { getIO } from "../socket.js";
import { AvailableAppointments } from "../models/appointment.js";

export const getPatientAppointments = async (req, res) => {
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
};

export const addAvailableAppointments = async (req, res) => {
  const { time } = req.body;

  const times = time.map((time) => {
    return { time: time };
  });

  await AvailableAppointments.destroy({ where: {}, truncate: true });

  await AvailableAppointments.bulkCreate(times);

  res
    .status(200)
    .json({ message: "Available appointments successfully added" });
};

export const getAvailableAppointments = async (req, res) => {
  const { date } = req.params;

  const availableAppointments = await AvailableAppointments.findAll({
    attributes: ["time"],
  });

  const scheduledAppointments = await Appointment.findAll({
    where: {
      date,
      status: "scheduled",
    },
    attributes: ["time"],
  });

  const scheduledTimes = scheduledAppointments.map((app) => app.time);

  const availableTimes = availableAppointments.filter((app) => {
    return !scheduledTimes.includes(app.time);
  });

  res.status(200).json({ availableTimes, scheduledTimes });
};

export const bookAppointment = async (req, res) => {
  const { date, time } = req.body;
  const { patientId } = req.params;

  const isAvailable = await AvailableAppointments.findOne({
    where: { time: time },
  });
  if (!isAvailable) throw new ApiError("This appointment is unavailable", 403);

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
};

export const cancelAppointment = async (req, res) => {
  const { appointmentId } = req.params;

  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) throw new ApiError("Appointment not found", 404);

  await appointment.destroy();

  const io = getIO();

  io.to("admins").emit("cancel-appointment", {
    message: "Cancel Appointment",
    date: appointment.date,
    time: appointment.time,
  });

  res.status(200).json({ message: "Appointment canceled successfully" });
};
