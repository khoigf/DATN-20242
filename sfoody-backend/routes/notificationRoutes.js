const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, notificationController.getUserNotifications);
router.put('/:id/read', verifyToken, notificationController.markNotificationAsRead);
router.delete('/:id', verifyToken, notificationController.deleteNotification);

module.exports = router;
