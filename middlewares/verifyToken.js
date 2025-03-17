import jwt from "jsonwebtoken";
import { configDotenv } from "dotenv";
import { ApiError } from "../utils/apiError.js";
import asyncHandler from "express-async-handler";
import { Admin } from "../models/admin.js";
configDotenv();

export const verifyToken = asyncHandler(async (req, res, next) => {
  let token;
  if (req.cookies["accessToken"]) {
    token = req.cookies["accessToken"];
  }

  if (!token) throw new ApiError("You are not authenticated.", 400);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
    if (err) return next(new ApiError("Token is not valid", 401));
    req.userId = user.id;
    req.userRole = user.role;
    const userDoc = await Admin.findByPk(user.id);
    if (!userDoc) return next(new ApiError("User not found", 404));
    next();
  });
});
