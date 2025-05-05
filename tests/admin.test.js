import request from "supertest";
import app from "../app.js";
import sequelize from "../config/db.js";
import redisClient from "../config/redis.js";
import { Admin } from "../models/index.js";
import { hash } from "bcrypt";

describe("Admin APIs", () => {
  let adminToken;
  let superAdminToken;

  beforeAll(async () => {
    try {
      sequelize.options.pool = {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      };

      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      await sequelize.sync({ force: true });
      console.log("Database connection established successfully.");

      // Create regular admin
      const hashedPassword = await hash("admin123", 10);
      await Admin.create({
        userName: "Test Admin",
        email: "admin@example.com",
        password: hashedPassword,
        role: "admin",
      });

      // Create super admin
      const superAdminHashedPassword = await hash("super123", 10);
      await Admin.create({
        userName: "Super Admin",
        email: "super@example.com",
        password: superAdminHashedPassword,
        role: "superAdmin",
      });

      // Login as regular admin
      const adminResponse = await request(app).post("/v1/api/admin/login").send({
        email: "admin@example.com",
        password: "admin123",
      });
      adminToken = adminResponse.headers["set-cookie"][0];

      // Login as super admin
      const superAdminResponse = await request(app).post("/v1/api/admin/login").send({
        email: "super@example.com",
        password: "super123",
      });
      superAdminToken = superAdminResponse.headers["set-cookie"][0];
    } catch (error) {
      console.error("Unable to connect to the database:", error);
      throw error;
    }
  }, 30000);

  // Login Tests
  it("should return 404 for unknown route", async () => {
    const response = await request(app).get("/v1/api/admin/unknown");
    expect(response.statusCode).toBe(404);
  });

  it("should login successfully with correct credentials as admin", async () => {
    const response = await request(app).post("/v1/api/admin/login").send({
      email: "admin@example.com",
      password: "admin123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Login successfully");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"][0]).toContain("adminToken");
  });

  it("should login successfully with correct credentials as superAdmin", async () => {
    const response = await request(app).post("/v1/api/admin/login").send({
      email: "super@example.com",
      password: "super123",
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Login successfully");
    expect(response.headers["set-cookie"]).toBeDefined();
    expect(response.headers["set-cookie"][0]).toContain("adminToken");
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

  // Add Admin Tests
  it("should add new admin successfully by superAdmin", async () => {
    const response = await request(app)
      .post("/v1/api/admin/add-admin")
      .set("Cookie", superAdminToken)
      .send({
        email: "newadmin3@example.com",
        userName: "New Admin",
        phone: "1234567890",
        password: "newpass123",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("OTP sent successfully");
  });

  it("should fail to add admin by regular admin", async () => {
    const response = await request(app)
      .post("/v1/api/admin/add-admin")
      .set("Cookie", adminToken)
      .send({
        email: "newadmin2@example.com",
        userName: "New Admin 2",
        phone: "1234567890",
        password: "newpass123",
      });

    expect(response.statusCode).toBe(403);
  });

  it("should fail to add admin with existing email", async () => {
    const response = await request(app)
      .post("/v1/api/admin/add-admin")
      .set("Cookie", superAdminToken)
      .send({
        email: "admin@example.com",
        userName: "Duplicate Admin",
        phone: "1234567890",
        password: "newpass123",
      });

    expect(response.statusCode).toBe(401);
  });

  // Get Admins Tests
  it("should get all admins successfully by superAdmin", async () => {
    const response = await request(app)
      .get("/v1/api/admin/get-all-admins")
      .set("Cookie", superAdminToken);

    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.admins)).toBe(true);
    expect(response.body.admins.length).toBeGreaterThan(0);
  });

  it("should fail to get admins by regular admin", async () => {
    const response = await request(app)
      .get("/v1/api/admin/get-all-admins")
      .set("Cookie", adminToken);

    expect(response.statusCode).toBe(403);
  });

  // Update Admin Tests
  // it("should update own profile successfully", async () => {
  //   const response = await request(app)
  //     .patch("/v1/api/admin/update-admin")
  //     .set("Cookie", adminToken)
  //     .send({
  //       userName: "Updated Admin",
  //       phone: "9876543210",
  //     });

  //   expect(response.statusCode).toBe(200);
  //   expect(response.body.message).toBe("Admin updated successfully");
  // });

  // it("should fail to update other admin's profile", async () => {
  //   const response = await request(app)
  //     .patch("/v1/api/admin/update-admin/other-id")
  //     .set("Cookie", adminToken)
  //     .send({
  //       userName: "Updated Admin",
  //       phone: "9876543210",
  //     });

  //   expect(response.statusCode).toBe(403);
  // });

  // Delete Admin Tests
  it("should fail to delete admin by regular admin", async () => {
    // First get the admin ID we want to delete
    const getAdminsResponse = await request(app)
      .get("/v1/api/admin/get-all-admins")
      .set("Cookie", superAdminToken);

    const adminToDelete = getAdminsResponse.body.admins.find(
      (admin) => admin.email === "super@example.com"
    );

    const response = await request(app)
      .delete(`/v1/api/admin/delete-admin/${adminToDelete.admin_id}`)
      .set("Cookie", adminToken);

    expect(response.statusCode).toBe(403);
  });

  it("should delete admin successfully by superAdmin", async () => {
    // First get the admin ID we want to delete
    const getAdminsResponse = await request(app)
      .get("/v1/api/admin/get-all-admins")
      .set("Cookie", superAdminToken);

    const adminToDelete = getAdminsResponse.body.admins.find(
      (admin) => admin.email === "admin@example.com"
    );

    const response = await request(app)
      .delete(`/v1/api/admin/delete-admin/${adminToDelete.admin_id}`)
      .set("Cookie", superAdminToken);

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Admin deleted successfully");
  });

  it("should fail to delete non-existent admin", async () => {
    const response = await request(app)
      .delete("/v1/api/admin/delete-admin/00000000-0000-0000-0000-000000000000")
      .set("Cookie", superAdminToken);

    expect(response.statusCode).toBe(404);
  });

  afterAll(async () => {
    try {
      await sequelize.close({ force: true });
      console.log("Database connection closed successfully.");
      if (redisClient.isOpen) {
        await redisClient.quit();
        console.log("Redis connection closed successfully.");
      }
    } catch (error) {
      console.error("Error closing connections:", error);
      throw error;
    }
  }, 30000);
});
