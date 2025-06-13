const express = require('express');
const router = express.Router();
const mealPlanController = require('../controllers/mealPlanController');
const { verifyToken } = require('../middleware/authMiddleware');

// CRUD cơ bản
router.post('/', verifyToken, mealPlanController.createMealPlan);      // Lưu meal plan (khi người dùng xác nhận)
router.get('/', verifyToken, mealPlanController.getMealPlan);          // Lấy theo ngày, user, loại plan
router.get('/:id', verifyToken, mealPlanController.getMealPlanById);   // Lấy theo ID
router.put('/:id', verifyToken, mealPlanController.updateMealPlan);    // Cập nhật meal plan
router.delete('/:id', verifyToken, mealPlanController.deleteMealPlan); // Xoá meal plan

// Gợi ý thực đơn (chỉ trả về danh sách gợi ý, chưa lưu)
router.post('/suggest', verifyToken, mealPlanController.suggestMealPlan);

module.exports = router;
