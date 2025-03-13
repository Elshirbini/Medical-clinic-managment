import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const MedicalRecord = sequelize.define(
  "medical_records",
  {
    medical_record_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    appointment_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    diagnosis: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    symptoms: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    chiefComplaint: {
      type: DataTypes.STRING,
    },
    investigations: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    prescription: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      allowNull: false,
    },
    procedures: {
      type: DataTypes.ARRAY(DataTypes.STRING),
    },
    image: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  { indexes: [{ fields: ["patient_id"] }],timestamps: true }
);
