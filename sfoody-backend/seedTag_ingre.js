const mongoose = require('mongoose');
const Tag = require('./models/tagModel');
const Ingredient = require('./models/ingredientModel');

// Kết nối MongoDB
mongoose.connect('mongodb+srv://root:8KPVZpgNIqnIq2gP@cluster0.ipujnzr.mongodb.net/Sfoody', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const userId = new mongoose.Types.ObjectId(); // Giả lập 1 user cố định để gán cho 10 recipe

// 1. Dữ liệu mẫu
const tags = [
  { name: 'Grilled', category: 'cooking_style' },
  { name: 'Low Carb', category: 'nutrition' },
  { name: 'Italian', category: 'region' },
  { name: 'Christmas', category: 'occasion' },
  { name: 'Quick Meals', category: 'cooking_time' },
  { name: 'Chicken', category: 'ingredient' },
  { name: 'Spicy', category: 'other' },
  { name: 'Vegetarian', category: 'nutrition' },
  { name: 'Baked', category: 'cooking_style' },
  { name: 'Healthy', category: 'nutrition' }
];

const ingredients = [
  { name: 'Chicken breast', category: 'meat' },
  { name: 'Garlic', category: 'spice' },
  { name: 'Olive oil', category: 'other' },
  { name: 'Tomato', category: 'vegetable' },
  { name: 'Basil', category: 'spice' },
  { name: 'Onion', category: 'vegetable' },
  { name: 'Salt', category: 'spice' },
  { name: 'Pepper', category: 'spice' },
  { name: 'Pasta', category: 'other' },
  { name: 'Cheese', category: 'other' }
];

(async () => {
  try {
    // Clean old data
    await Promise.all([
      Tag.deleteMany({}),
      Ingredient.deleteMany({})
    ]);

    const createdTags = await Tag.insertMany(tags);
    const createdIngredients = await Ingredient.insertMany(ingredients);

    console.log('✅ Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during seeding:', err);
    process.exit(1);
  }
})();
