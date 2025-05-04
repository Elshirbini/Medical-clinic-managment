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
    gender: {
      type: DataTypes.ENUM("male", "female"),
      allowNull: false,
    },
    age: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Temporarily
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false,
      // unique: true, // Temporarily
    },
  },
  { indexes: [{ fields: ["patient_id"] }], timestamps: true }
);
