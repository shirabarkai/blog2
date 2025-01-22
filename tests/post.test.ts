import request from "supertest";
import { app } from "./setup";
import User from "../src/models/User";
import Post from "../src/models/Post";
import mongoose from "mongoose";

describe("Post Management", () => {
  let authToken: string;
  let postId: string;

  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  };

  const testPost = {
    title: "Test Post",
    content: "This is a test post content",
  };

  beforeEach(async () => {
    // Register and login user
    await request(app).post("/api/users/register").send(testUser);

    const loginRes = await request(app).post("/api/users/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.accessToken;
  });

  describe("Post Creation", () => {
    it("should create a new post", async () => {
      const res = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(testPost);

      expect(res.status).toBe(201);
      expect(res.body.post).toHaveProperty("title", testPost.title);
      expect(res.body.post).toHaveProperty("content", testPost.content);
    });

    it("should not create post without authentication", async () => {
      const res = await request(app).post("/api/posts").send(testPost);

      expect(res.status).toBe(401);
    });
  });

  describe("Post Retrieval", () => {
    beforeEach(async () => {
      // Create a test post
      const postRes = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(testPost);
      postId = postRes.body.post.id;
    });

    it("should get all posts", async () => {
      const res = await request(app)
        .get("/api/posts")
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("should get a specific post by ID", async () => {
      const res = await request(app)
        .get(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("title", testPost.title);
      expect(res.body).toHaveProperty("content", testPost.content);
    });
  });

  describe("Post Update", () => {
    beforeEach(async () => {
      const postRes = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(testPost);
      postId = postRes.body.post.id;
    });

    it("should update post by author", async () => {
      const updateData = {
        title: "Updated Title",
        content: "Updated content",
      };

      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.post).toHaveProperty("title", updateData.title);
      expect(res.body.post).toHaveProperty("content", updateData.content);
    });

    it("should not update post without authentication", async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}`)
        .send({ title: "Updated Title" });

      expect(res.status).toBe(401);
    });
  });

  describe("Post Deletion", () => {
    beforeEach(async () => {
      const postRes = await request(app)
        .post("/api/posts")
        .set("Authorization", `Bearer ${authToken}`)
        .send(testPost);
      postId = postRes.body.post.id;
    });

    it("should delete post by author", async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("message", "Post deleted successfully");
    });

    it("should not delete post without authentication", async () => {
      const res = await request(app).delete(`/api/posts/${postId}`);

      expect(res.status).toBe(401);
    });
  });

  // ... rest of the test file
});
