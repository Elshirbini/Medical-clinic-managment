import sequelize from "../config/db.js";
import { DataTypes } from "sequelize";

export const Admin = sequelize.define(
  "admins",
  {
    admin_id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Email must be unique",
      },
    },
    phone: {
      type: DataTypes.STRING,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("superAdmin", "admin"),
      defaultValue: "admin",
    },
  },
  { timestamps: true }
);
