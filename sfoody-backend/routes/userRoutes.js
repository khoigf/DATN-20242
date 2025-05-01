const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Hồ sơ cá nhân
router.get('/me', verifyToken, userController.getProfile);
router.put('/me', verifyToken, userController.updateProfile);

// Công thức đã đăng và yêu thích
router.get('/me/posts', verifyToken, userController.getUserPosts);
router.get('/me/favorites', verifyToken, userController.getFavorites);
router.delete('/me/favorites/:recipeId', verifyToken, userController.removeFavorite);

module.exports = router;