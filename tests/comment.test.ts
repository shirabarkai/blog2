import request from "supertest";
import { app } from "./setup";
import mongoose from "mongoose";

describe("Comment Management", () => {
  let authToken: string;
  let postId: string;
  let commentId: string;

  const testUser = {
    username: "testuser",
    email: "test@example.com",
    password: "password123",
  };

  const testPost = {
    title: "Test Post",
    content: "This is a test post content",
  };

  const testComment = {
    content: "This is a test comment",
  };

  beforeEach(async () => {
    // Register and login user
    await request(app).post("/api/users/register").send(testUser);

    const loginRes = await request(app).post("/api/users/login").send({
      email: testUser.email,
      password: testUser.password,
    });

    authToken = loginRes.body.accessToken;

    // Create a test post
    const postRes = await request(app)
      .post("/api/posts")
      .set("Authorization", `Bearer ${authToken}`)
      .send(testPost);

    postId = postRes.body.post.id;
  });

  describe("Comment Creation", () => {
    it("should create a new comment on a post", async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testComment);

      expect(res.status).toBe(201);
      expect(res.body.comment).toHaveProperty("content", testComment.content);
      commentId = res.body.comment.id;
    });

    it("should not create comment without authentication", async () => {
      const res = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .send(testComment);

      expect(res.status).toBe(401);
    });

    it("should not create comment on non-existent post", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();

      const res = await request(app)
        .post(`/api/posts/${nonExistentId}/comments`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testComment);

      expect(res.status).toBe(404);
    });
  });

  describe("Comment Retrieval", () => {
    beforeEach(async () => {
      // Create a test comment
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testComment);
      commentId = commentRes.body.comment.id;
    });

    it("should get all comments for a post", async () => {
      const res = await request(app)
        .get(`/api/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty("content", testComment.content);
    });
  });

  describe("Comment Update", () => {
    beforeEach(async () => {
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testComment);
      commentId = commentRes.body.comment.id;
    });

    it("should update comment by author", async () => {
      const updateData = {
        content: "Updated comment content",
      };

      const res = await request(app)
        .put(`/api/posts/${postId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.comment).toHaveProperty("content", updateData.content);
    });

    it("should not update comment without authentication", async () => {
      const res = await request(app)
        .put(`/api/posts/${postId}/comments/${commentId}`)
        .send({ content: "Updated content" });

      expect(res.status).toBe(401);
    });

    it("should not update comment by non-author", async () => {
      // Create another user
      const anotherUser = {
        username: "another",
        email: "another@example.com",
        password: "password123",
      };

      await request(app).post("/api/users/register").send(anotherUser);

      const loginRes = await request(app).post("/api/users/login").send({
        email: anotherUser.email,
        password: anotherUser.password,
      });

      const anotherToken = loginRes.body.accessToken;

      const res = await request(app)
        .put(`/api/posts/${postId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${anotherToken}`)
        .send({ content: "Updated content" });

      expect(res.status).toBe(403);
    });
  });

  describe("Comment Deletion", () => {
    beforeEach(async () => {
      const commentRes = await request(app)
        .post(`/api/posts/${postId}/comments`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(testComment);
      commentId = commentRes.body.comment.id;
    });

    it("should delete comment by author", async () => {
      const res = await request(app)
        .delete(`/api/posts/${postId}/comments/${commentId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty(
        "message",
        "Comment deleted successfully"
      );
    });

    it("should not delete comment without authentication", async () => {
      const res = await request(app).delete(
        `/api/posts/${postId}/comments/${commentId}`
      );

      expect(res.status).toBe(401);
    });
  });
});
