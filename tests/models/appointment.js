import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const Appointment = sequelize.define(
  "appointments",
  {
    appointment_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    time: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "cancelled", "completed"),
      allowNull: false,
    },
  },
  { indexes: [{ fields: ["patient_id"] }], timestamps: true }
);

export const AvailableAppointments = sequelize.define("available_appointments", {
  appointment_id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  time: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});
