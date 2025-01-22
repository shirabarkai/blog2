import { Response, NextFunction } from "express";
import Comment, { IComment } from "../models/Comment";
import Post from "../models/Post";
import { AuthRequest } from "../types";
import mongoose from "mongoose";

const commentController = {
  // Create new comment
  async createComment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }

      const { content } = req.body;
      const postId = req.params.postId;

      // Check if post exists
      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ message: "Post not found" });
        return;
      }

      const comment = new Comment({
        content,
        post: postId,
        author: req.user!._id,
      });

      await comment.save();

      const commentResponse = {
        id: comment._id.toString(),
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };

      res.status(201).json({
        message: "Comment created successfully",
        comment: commentResponse,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get comments for a post
  async getPostComments(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.postId)) {
        res.status(400).json({ message: "Invalid post ID" });
        return;
      }

      const comments = await Comment.find({
        post: req.params.postId,
      }).populate<{
        author: {
          username: string;
          email: string;
        };
      }>("author", "username email");

      const commentsResponse = comments.map((comment) => ({
        id: comment._id.toString(),
        content: comment.content,
        author: {
          username: comment.author.username,
          email: comment.author.email,
        },
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      }));

      res.json(commentsResponse);
    } catch (error) {
      next(error);
    }
  },

  // Update comment
  async updateComment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
        res.status(400).json({ message: "Invalid comment ID" });
        return;
      }

      const { content } = req.body;
      const comment = (await Comment.findById(
        req.params.commentId
      )) as IComment;

      if (!comment) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      // Check if user is the author
      if (comment.author.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          message: "Not authorized to update this comment",
        });
        return;
      }

      comment.content = content;
      await comment.save();

      const commentResponse = {
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
      };

      res.json({
        message: "Comment updated successfully",
        comment: commentResponse,
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete comment
  async deleteComment(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.params.commentId)) {
        res.status(400).json({ message: "Invalid comment ID" });
        return;
      }

      const comment = (await Comment.findById(
        req.params.commentId
      )) as IComment;

      if (!comment) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }

      // Check if user is the author
      if (comment.author.toString() !== req.user!._id.toString()) {
        res.status(403).json({
          message: "Not authorized to delete this comment",
        });
        return;
      }

      await comment.deleteOne();
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
};

export default commentController;
