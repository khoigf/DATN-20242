const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { verifyToken } = require('../middleware/authMiddleware'); // middleware xác thực JWT

router.post('/', verifyToken, commentController.createComment);
router.get('/recipe/:id', commentController.getCommentsByRecipe);

module.exports = router;
