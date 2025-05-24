// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

const multer = require('multer');
const path = require('path');
const { fileFilter } = require('../middleware/fileFilter');

// Cấu hình multer như bên recipe
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + file.fieldname + ext);
  },
});

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB cho avatar
});

router.get('/me', verifyToken, userController.getProfile);
router.put('/me', verifyToken, upload.fields([{ name: 'avatar', maxCount: 1 }]), userController.updateProfile);

module.exports = router;