const Ingredient = require('../models/ingredientModel');

// Lấy toàn bộ nguyên liệu (nếu cần)
exports.getAllIngre = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    res.status(200).json(ingredients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy nguyên liệu và nhóm theo category
exports.getGroupedIngre = async (req, res) => {
  try {
    const ingredients = await Ingredient.find();
    const grouped = {};

    ingredients.forEach(ingredient => {
      if (!grouped[ingredient.category]) grouped[ingredient.category] = [];
      grouped[ingredient.category].push(ingredient);
    });

    res.status(200).json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};