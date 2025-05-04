// server.js
import http from "http";
import sequelize from "./config/db.js";
import { superAdmin } from "./config/superAdmin.js";
import { setUpSocket } from "./socket.js";
import app from "./app.js";

const server = http.createServer(app);

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

process.on("unhandledRejection", (err) => {
  console.error(`Unhandled Rejection Errors : ${err.name} | ${err.message}`);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error(`Unhandled Caught Errors : ${err.name} | ${err.message}`);
  process.exit(1);
});

startServer();