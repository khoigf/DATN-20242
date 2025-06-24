const mongoose = require('mongoose');
const client = require('../utils/searchClient');
env = require('dotenv').config();

const Recipe = require('../models/recipeModel');
const RecipeTag = require('../models/recipeTagModel');
const Tag = require('../models/tagModel');
const RecipeIngredient = require('../models/recipeIngredient');
const Ingredient = require('../models/ingredientModel');

const getFullImageUrl = (imagePath) => {
  return imagePath ? `${process.env.IMAGE_URL}${imagePath}` : null;
};

// Kết nối MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function syncRecipesToMeili() {
  try {
    const index = client.index('recipes');

    // 1. Lấy tất cả công thức
    const recipes = await Recipe.find().lean();
    index.deleteAllDocuments(); // Xóa tất cả tài liệu trong chỉ mục trước khi thêm mới
    const results = [];

    for (const recipe of recipes) {
      // 2. Lấy tags
      const recipeTags = await RecipeTag.find({ recipe_id: recipe._id }).populate('tag_id').lean();
      const tags = recipeTags.map(rt => rt.tag_id?.name).filter(Boolean);

      // 3. Lấy ingredients
      const recipeIngredients = await RecipeIngredient.find({ recipe_id: recipe._id }).populate('ingredient_id').lean();
      const ingredients = recipeIngredients.map(ri => ({
        name: ri.ingredient_id?.name || '',
        quantity: ri.quantity || '',
        category: ri.ingredient_id?.category || '',
      })).filter(i => i.name);

      // 4. Format object
      results.push({
        id: recipe._id.toString(),
        title: recipe.title,
        description: recipe.description,
        instruction: recipe.instruction,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        image_url: getFullImageUrl(recipe.image_url),
        video_url: recipe.video_url,
        created_at: recipe.created_at,
        status: recipe.status,
        user_id: recipe.user_id.toString(),
        tags,         // mảng chuỗi tag name
        ingredients,  // mảng object { name, quantity, category }
      });
    }

    // 5. Gửi lên Meilisearch
    const res = await index.addDocuments(results);
    console.log('✅ Đã đồng bộ công thức lên Meilisearch:', res);
  } catch (err) {
    console.error('❌ Lỗi khi đồng bộ:', err);
  } finally {
    mongoose.disconnect();
  }
}

syncRecipesToMeili();
