import express from "express";
import { login, signup, verifyOTP } from "../controllers/patient.js";
// import { verifyToken } from "../middlewares/verifyToken.js";
import { otpRateLimiter } from "../middlewares/rateLimiter.js";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.post("/verify-otp", otpRateLimiter, verifyOTP);
export const patientRoutes = router;
