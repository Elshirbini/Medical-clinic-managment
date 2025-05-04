import { Sequelize } from "sequelize";
import { configDotenv } from "dotenv";
configDotenv();

console.log(process.env.DB_URL_TEST);

const sequelize = new Sequelize(process.env.DB_URL_TEST, {
  dialect: process.env.DB_DIALECT,
  logging: false,
});
(async () => {
  await sequelize.authenticate();
  console.log("Connected to PostgreSQL successfully.");
})();

export default sequelize;
