import { Response, NextFunction } from "express";
import Post, { IPost } from "../models/Post";
import { AuthRequest } from "../types";
import mongoose, { ObjectId, Document } from "mongoose";
import Comment from "../models/Comment";

interface PopulatedPostDocument extends Omit<IPost, "author"> {
  author: {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
  };
}

const postController = {
  // Create new post
  async createPost(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, content } = req.body;
      const post = new Post({
        title,
        content,
        author: req.user!._id,
      }) as IPost;

      await post.save();

      const postResponse = {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      res.status(201).json({
        message: "Post created successfully",
        post: postResponse,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all posts
  async getAllPosts(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const posts = (await Post.find()
        .populate<{
          author: { _id: ObjectId; username: string; email: string };
        }>("author", "username email")
        .sort({ createdAt: -1 })) as unknown as PopulatedPostDocument[];

      const postsResponse = posts.map((post) => ({
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: {
          id: post.author._id.toString(),
          username: post.author.username,
          email: post.author.email,
        },
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      }));

      res.json(postsResponse);
    } catch (error) {
      next(error);
    }
  },

  // Get post by ID
  async getPostById(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }

      const post = (await Post.findById(
        req.params.id
      )) as PopulatedPostDocument;

      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }

      const comments = (await Comment.find({ post: post._id })) as Document[];

      const postResponse = {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: {
          id: post.author._id.toString(),
          username: post.author.username,
          email: post.author.email,
        },
        comments,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      res.json(postResponse);
    } catch (error) {
      next(error);
    }
  },

  // Update post
  async updatePost(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }

      const { title, content } = req.body;
      const post = (await Post.findById(
        req.params.id
      )) as PopulatedPostDocument;

      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }

      // Check if user is the author
      if (post.author.toString() !== req.user!._id.toString()) {
        res.status(403).json({ message: "Not authorized to update this post" });
        return;
      }

      if (title) post.title = title;
      if (content) post.content = content;

      await post.save();

      const postResponse = {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };

      res.json({
        message: "Post updated successfully",
        post: postResponse,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete post
  async deletePost(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }

      const post = (await Post.findById(
        req.params.id
      )) as PopulatedPostDocument;

      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }

      // Check if user is the author
      if (post.author.toString() !== req.user!._id.toString()) {
        res.status(403).json({ message: "Not authorized to delete this post" });
        return;
      }

      await post.deleteOne();
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default postController;
