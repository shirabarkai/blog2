const Post = require('../models/Post');

// Post Controller methods
const postController = {
  // Create a new post
  createPost: async (req, res) => {
    try {
      const post = new Post(req.body);
      const savedPost = await post.save();
      res.status(201).json(savedPost);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Get all posts
  getAllPosts: async (req, res) => {
    try {
      const { sender } = req.query;
      const query = sender ? { senderId: sender } : {};
      const posts = await Post.find(query);
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Get post by ID
  getPostById: async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // Update post
  updatePost: async (req, res) => {
    try {
      const updatedPost = await Post.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );
      if (!updatedPost) return res.status(404).json({ message: 'Post not found' });
      res.json(updatedPost);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },

  // Delete post
  deletePost: async (req, res) => {
    try {
      const deletedPost = await Post.findByIdAndDelete(req.params.id);
      if (!deletedPost) return res.status(404).json({ message: 'Post not found' });
      res.json({ message: 'Post deleted' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

module.exports = postController; 