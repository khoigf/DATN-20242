const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Chỉ admin
router.get('/users', verifyToken, isAdmin, adminController.getAllUsers);
router.put('/users/:id/status', verifyToken, isAdmin, adminController.updateUserStatus);

router.get('/posts', verifyToken, isAdmin, adminController.getAllPosts);
router.get('/posts/:id', verifyToken, isAdmin, adminController.getPostById);
router.put('/posts/:id/status', verifyToken, isAdmin, adminController.updatePostStatus);

router.get('/reports', verifyToken, isAdmin, adminController.getAllReports);
router.get('/reports/:id', verifyToken, isAdmin, adminController.getReportById);
router.put('/reports/:id/status', verifyToken, isAdmin, adminController.updateReportStatus);

router.get('/summary', verifyToken, isAdmin, adminController.getSummary);

module.exports = router;