import express from "express";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import { configDotenv } from "dotenv";
import { errorHandling } from "./middlewares/errorHandling.js";
import { ApiError } from "./utils/apiError.js";
import sequelize from "./config/db.js";
configDotenv();

const app = express();

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

app.all("*", (req, res, next) => {
  next(new ApiError(`Can't find this route : ${req.originalUrl}`, 400));
});

app.use(errorHandling);

(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("✅ All models were synchronized successfully.");

    app.listen(process.env.PORT, () => {
      console.log(`🚀 Server running on PORT:${process.env.PORT}`);
    });
  } catch (error) {
    console.error("❌ Unable to synchronize models:", error);
  }
})();

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection Errors : ${err.name} | ${err.message}`);
  process.exit(1);
});
