import express from "express";
import { login, signup, verifyOTP } from "../controllers/patient.js";

const route = express.Router();

route.post("/login", login);
route.post("/signup", signup);
route.post("/verify-otp", verifyOTP);

export const patientRoutes = route;
