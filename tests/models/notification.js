import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const Notification = sequelize.define(
  "notifications",
  {
    notification_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    patient_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("consultation", "update", "cancel"),
    },
    sendAt: {
      type: DataTypes.DATE,
      defaultValue: new Date(),
    },
  },
  { indexes: [{ fields: ["patient_id"] }], timestamps: true }
);
