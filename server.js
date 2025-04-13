import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import sequelize from "./config/db.js";
import morgan from "morgan";
import { configDotenv } from "dotenv";
import { errorHandling } from "./middlewares/errorHandling.js";
import { superAdmin } from "./config/superAdmin.js";
import { patientRoutes } from "./routes/patient.js";
import { adminRoutes } from "./routes/admin.js";
import { appointmentsRoutes } from "./routes/appointment.js";
import { setUpSocket } from "./socket.js";
configDotenv();

const app = express();
const server = http.createServer(app);
app.use(morgan("dev"));
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(compression());
app.use(helmet());

//                                 **ROUTES**

app.use("/api/patient", patientRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/appointment", appointmentsRoutes);

app.use(errorHandling);
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true });
    await superAdmin();
    console.log("✅ All models were synchronized successfully.");

    server.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on PORT:${process.env.PORT}`);
    });

    setUpSocket(server);
  } catch (error) {
    console.error("❌ Unable to synchronize models:", error);
  }
};

startServer();

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection Errors : ${err.name} | ${err.message}`);
  process.exit(1);
});
