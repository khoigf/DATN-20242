const express = require('express');
const router = express.Router();
const tagController = require('../controllers/tagController');

router.get('/', tagController.getAllTags); // Lấy tất cả tags
router.get('/grouped', tagController.getGroupedTags); // Lấy tags theo từng category

module.exports = router;
