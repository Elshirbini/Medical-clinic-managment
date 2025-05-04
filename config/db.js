import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";
configDotenv();

const isTest = process.env.NODE_ENV === "test";

const sequelize = new Sequelize(
  isTest ? process.env.DB_URL_TEST : process.env.DB_URL,
  {
    dialect: process.env.DB_DIALECT,
    logging: false,
  }
);
(async () => {
  await sequelize.authenticate();
  console.log("Connected to PostgreSQL successfully.");
})();

export default sequelize;
