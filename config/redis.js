import { createClient } from "redis";
import { configDotenv } from "dotenv";
configDotenv();

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT,
  },
  password: process.env.REDIS_PASS,
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();

console.log("Connected to Redis");

export default redisClient;
