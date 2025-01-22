import request from "supertest";
import { app } from "./setup";
import User from "../src/models/User";
import mongoose from "mongoose";

describe("User Authentication & Management", () => {
  let authToken: string;
  let refreshToken: string;

  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  };

  // Clear users collection before each test
  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe("Registration", () => {
    it("should register a new user successfully", async () => {
      const res = await request(app).post("/api/users/register").send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.username).toBe(testUser.username);
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
    });

    it("should not register a user with existing email", async () => {
      // First registration
      await request(app).post("/api/users/register").send(testUser);

      // Second registration attempt
      const res = await request(app).post("/api/users/register").send(testUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("message");
    });

    it("should not register a user with invalid email", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          ...testUser,
          email: "invalid-email",
        });

      expect(res.status).toBe(400);
    });

    it("should not register a user with short password", async () => {
      const res = await request(app)
        .post("/api/users/register")
        .send({
          ...testUser,
          password: "12345",
        });

      expect(res.status).toBe(400);
    });
  });

  describe("Login", () => {
    beforeEach(async () => {
      // Register a user before each login test
      await request(app).post("/api/users/register").send(testUser);
    });

    it("should login successfully with correct credentials", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("accessToken");
      expect(res.body).toHaveProperty("refreshToken");
      expect(res.body).toHaveProperty("user");
      expect(res.body.user.email).toBe(testUser.email);

      authToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });

    it("should not login with incorrect password", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: testUser.email,
        password: "wrongpassword",
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid email or password");
    });

    it("should not login with non-existent email", async () => {
      const res = await request(app).post("/api/users/login").send({
        email: "nonexistent@example.com",
        password: testUser.password,
      });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("message", "Invalid email or password");
    });
  });

  describe("Logout", () => {
    beforeEach(async () => {
      // Register and login user
      await request(app).post("/api/users/register").send(testUser);

      const loginRes = await request(app).post("/api/users/login").send({
        email: testUser.email,
        password: testUser.password,
      });

      authToken = loginRes.body.accessToken;
      refreshToken = loginRes.body.refreshToken;
    });

    it("should logout successfully", async () => {
      const res = await request(app)
        .post("/api/users/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Logout successful");
    });
  });

  describe("User CRUD Operations", () => {
    let userId: string;
    let authToken: string;

    beforeEach(async () => {
      // Register and login a test user
      await request(app).post("/api/users/register").send(testUser);
      const loginRes = await request(app).post("/api/users/login").send({
        email: testUser.email,
        password: testUser.password,
      });
      authToken = loginRes.body.accessToken;
      userId = loginRes.body.user.id;
    });

    describe("Get Users", () => {
      it("should get all users", async () => {
        const res = await request(app)
          .get("/api/users")
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBeTruthy();
        expect(res.body.length).toBeGreaterThan(0);
        expect(res.body[0]).toHaveProperty("username", testUser.username);
      });

      it("should get user by ID", async () => {
        const res = await request(app)
          .get(`/api/users/${userId}`)
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("username", testUser.username);
        expect(res.body).toHaveProperty("email", testUser.email);
        expect(res.body).not.toHaveProperty("password");
      });

      it("should return 404 for non-existent user", async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const res = await request(app)
          .get(`/api/users/${fakeId}`)
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(404);
      });
    });

    describe("Update User", () => {
      it("should update own user profile", async () => {
        const updateData = {
          username: "updateduser",
          email: "updated@example.com",
        };

        const res = await request(app)
          .put(`/api/users/${userId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send(updateData);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("username", updateData.username);
        expect(res.body).toHaveProperty("email", updateData.email);
      });

      it("should not update another user's profile", async () => {
        // Create another user
        const anotherUser = {
          username: "another",
          email: "another@example.com",
          password: "password123",
        };
        const registerRes = await request(app)
          .post("/api/users/register")
          .send(anotherUser);
        const anotherId = registerRes.body.user.id;

        const res = await request(app)
          .put(`/api/users/${anotherId}`)
          .set("Authorization", `Bearer ${authToken}`)
          .send({ username: "hacked" });

        expect(res.status).toBe(403);
      });
    });

    describe("Delete User", () => {
      it("should delete own user account", async () => {
        const res = await request(app)
          .delete(`/api/users/${userId}`)
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty("message", "User deleted successfully");

        // Verify user is deleted
        const checkUser = await User.findById(userId);
        expect(checkUser).toBeNull();
      });

      it("should not delete another user's account", async () => {
        const anotherUser = {
          username: "another",
          email: "another@example.com",
          password: "password123",
        };
        const registerRes = await request(app)
          .post("/api/users/register")
          .send(anotherUser);
        const anotherId = registerRes.body.user.id;

        const res = await request(app)
          .delete(`/api/users/${anotherId}`)
          .set("Authorization", `Bearer ${authToken}`);

        expect(res.status).toBe(403);
      });
    });
  });
});
