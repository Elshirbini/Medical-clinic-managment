import asyncHandler from "express-async-handler";
import { ApiError } from "../utils/apiError.js";
import { Admin } from "../models/admin.js";

export const restrictTo = (...roles) =>
  asyncHandler(async (req, res, next) => {
    const userRole = req.userRole;
    const userId = req.userId;

    const admin = await Admin.findByPk(userId);

    if (!admin || !userRole || !roles.includes(userRole)) {
      return next(new ApiError("ليس لديك الإذن للقيام بهذا الإجراء", 403));
    }
    next();
  });
