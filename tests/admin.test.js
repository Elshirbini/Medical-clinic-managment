import request from "supertest";
import app from "../app.js";
import sequelize from "./config/db.js";
import redisClient from "../config/redis.js";
import { Admin } from "./models/admin.js";
import { hash } from "bcrypt";

describe("Admin APIs", () => {
  beforeAll(async () => {
    try {
      sequelize.options.pool = {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      };

      await sequelize.sync({ force: true }); 
      await sequelize.authenticate();
      console.log("Database connection established successfully.");

      const hashedPassword = await hash("admin123", 10);
      await Admin.create({
        userName: "Test Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      });
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      throw error;
    }
  }, 30000);

  it("should return 404 for unknown route", async () => {
    const response = await request(app).get("/v1/api/admin/unknown");
    expect(response.statusCode).toBe(404);
  });

  it("should login successfully with correct credentials", async () => {
    const response = await request(app).post("/v1/api/admin/login").send({
      email: "admin@example.com",
      password: "admin123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Login successfully");
    expect(response.headers["set-cookie"]).toBeDefined();
  });

  it("should fail login with wrong email", async () => {
    const response = await request(app).post("/v1/api/admin/login").send({
      email: "wrong@example.com",
      password: "admin123",
    });

    expect(response.statusCode).toBe(401);
  });

  it("should fail login with wrong password", async () => {
    const response = await request(app).post("/v1/api/admin/login").send({
      email: "admin@example.com",
      password: "wrongpassword",
    });

    expect(response.statusCode).toBe(403);
  });

  afterAll(async () => {
    try {
      await sequelize.close({ force: true });
      console.log("Database connection closed successfully.");
      await redisClient.quit();
      console.log("Redis connection closed successfully.");
    } catch (error) {
      console.error("Error closing connections:", error);
      throw error;
    }
  }, 30000);
});
