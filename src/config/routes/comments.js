const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Routes
router.post('/', commentController.createComment);
router.get('/post/:postId', commentController.getPostComments);
router.get('/:id', commentController.getCommentById);
router.put('/:id', commentController.updateComment);
router.delete('/:id', commentController.deleteComment);

module.exports = router; 