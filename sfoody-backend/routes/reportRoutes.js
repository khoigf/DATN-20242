const express = require('express');
const router = express.Router();
const Report = require('../models/reportModel');
const {verifyToken} = require('../middleware/authMiddleware');

// POST /reports - gửi báo cáo
router.post('/', verifyToken, async (req, res) => {
  try {
    const { recipe_id, content } = req.body;
    const report = new Report({
      user_id: req.user.id,
      recipe_id,
      content,
    });
    await report.save();
    res.status(201).json({ message: 'Đã gửi báo cáo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;