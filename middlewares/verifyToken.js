import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "express-async-handler";
import { Admin } from "../models/admin.js";
import { Patient } from "../models/patient.js";
configDotenv();

export const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  let userDoc;
  if (req.cookies["adminToken"]) {
    token = req.cookies["adminToken"];
  }

  if (req.cookies["patientToken"]) {
    token = req.cookies["patientToken"];
  }

  if (!token) throw new ApiError("You are not authenticated.", 400);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return next(new ApiError("Token is not valid", 401));
    req.userId = user.id;
    req.userRole = user.role || undefined;
    if (user.role) {
      userDoc = await Admin.findByPk(user.id);
    } else {
      userDoc = await Patient.findByPk(user.id);
    }
    if (!userDoc) return next(new ApiError("User not found", 404));
    next();
  });
});
