import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import { configDotenv } from "dotenv";
import { errorHandling } from "./middlewares/errorHandling.js";
import { patientRoutes } from "./routes/patient.js";
import { adminRoutes } from "./routes/admin.js";
import { appointmentsRoutes } from "./routes/appointment.js";
import { consultationRoutes } from "./routes/consultation.js";

configDotenv();

const app = express();

//                                 **Middlewares**
app.use(morgan("dev"));
app.use(
  cors({
    origin: process.env.ORIGIN,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(compression());
app.use(helmet());

//                                 **ROUTES**
app.use("/v1/api/patient", patientRoutes);
app.use("/v1/api/admin", adminRoutes);
app.use("/v1/api/appointment", appointmentsRoutes);
app.use("/v1/api/consultation", consultationRoutes);

//                                 **Global Error Handler**
app.use(errorHandling);

export default app;
