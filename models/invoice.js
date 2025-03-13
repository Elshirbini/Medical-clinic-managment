import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const Invoice = sequelize.define(
  "invoices",
  {
    invoice_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    image: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    details: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM("paid", "unpaid"),
    },
  },
  { indexes: [{ fields: ["patient_id"] }], timestamps: true }
);
