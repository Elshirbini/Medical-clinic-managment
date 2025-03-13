import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const Patient = sequelize.define(
  "patients",
  {
    patient_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  { indexes: [{ fields: ["patient_id"] }], timestamps: true }
);
