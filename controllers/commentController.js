const Mongoose  = require('mongoose');
const Comment = require('../models/Comment');

const commentController = {
  // Create a new comment
  createComment: async (req, res) => {
    try {
      console.log(req.body)
      const comment = new Comment(req.body);
      const savedComment = await comment.save();
      res.status(201).json(savedComment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Get all comments for a post
  getPostComments: async (req, res) => {
    try {
      const comments = await Comment.find({ postId: new Mongoose.Types.ObjectId(req.params.postId) });
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get comment by ID
  getCommentById: async (req, res) => {
    try {
      const comment = await Comment.findById(req.params.id);
      if (!comment) return res.status(404).json({ message: 'Comment not found' });
      res.json(comment);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update comment
  updateComment: async (req, res) => {
    try {
      const updatedComment = await Comment.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedComment) return res.status(404).json({ message: 'Comment not found' });
      res.json(updatedComment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete comment
  deleteComment: async (req, res) => {
    try {
      const deletedComment = await Comment.findByIdAndDelete(req.params.id);
      if (!deletedComment) return res.status(404).json({ message: 'Comment not found' });
      res.json({ message: 'Comment deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = commentController; 