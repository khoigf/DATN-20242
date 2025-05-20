const express = require('express');
const router = express.Router();
const recipeController = require('../controllers/recipeController');
const { verifyToken } = require('../middleware/authMiddleware');
const { fileFilter } = require('../middleware/fileFilter');
const multer = require('multer');
const path = require('path');

// Cấu hình lưu file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // thư mục lưu trữ
    },
    filename: function (req, file, cb) {
      const ext = path.extname(file.originalname);
      cb(null, Date.now() + '-' + file.fieldname + ext);
    },
  });

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }, // tối đa 20MB
  });

router.post('/',verifyToken, upload.fields([
    { name: 'image', maxCount: 1 },
  ]), recipeController.createRecipe);
router.get('/',recipeController.getAllRecipes);
router.get('/user', verifyToken, recipeController.getRecipesByUserId);
router.get('/:id', recipeController.getRecipeById);

router.put('/:id', verifyToken, upload.fields([
    { name: 'image', maxCount: 1 },
  ]), recipeController.updateRecipe);
router.delete('/:id',verifyToken, recipeController.deleteRecipe);

module.exports = router;
