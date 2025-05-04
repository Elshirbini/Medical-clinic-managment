import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const Conversation = sequelize.define(
  "conversation",
  {
    conversation_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    doctor_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    patient_id: {
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
    },
    isClosed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { indexes: [{ fields: ["conversation_id"] }], timestamps: true }
);

export const Message = sequelize.define(
  "message",
  {
    message_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    conversation_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    sender_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    senderType: {
      type: DataTypes.ENUM("doctor", "patient"),
      allowNull: false,
    },
    message: {
      type: DataTypes.STRING,
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  { indexes: [{ fields: ["conversation_id"] }], timestamps: true }
);
