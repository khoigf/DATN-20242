const express = require('express');
const router = express.Router();
const ingreController = require('../controllers/ingreController');

router.get('/', ingreController.getAllIngre); // Lấy tất cả nguyên liệu
router.get('/grouped', ingreController.getGroupedIngre); // Lấy nguyên liệu theo từng category

module.exports = router;