const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const Tag = require('../models/tagModel');
const Ingredient = require('../models/ingredientModel');
const Recipe = require('../models/recipeModel');
const RecipeTag = require('../models/recipeTagModel');
const RecipeIngredient = require('../models/recipeIngredient');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Hàm tìm tag và ingredient trong câu hỏi
async function extractFilters(prompt) {
  const filters = {
    tagIds: [],
    excludeIngredientIds: [],
    includeIngredientIds: []
  };

  const promptLower = prompt.toLowerCase();

  const allTags = await Tag.find({});
  const allIngredients = await Ingredient.find({});

  // Gợi ý: lọc theo tên có trong câu hỏi
  for (const tag of allTags) {
    if (promptLower.includes(tag.name.toLowerCase())) {
      filters.tagIds.push(tag._id);
    }
  }

  for (const ing of allIngredients) {
    const name = ing.name.toLowerCase();
    if (promptLower.includes(name)) {
      if (/(không|tránh|dị ứng).{0,6}(?:với )?/i.test(prompt)) {
        filters.excludeIngredientIds.push(ing._id);
      } else {
        filters.includeIngredientIds.push(ing._id);
      }
    }
  }

  return filters;
}

router.post('/ask', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ message: 'Thiếu prompt' });

  try {
    const filters = await extractFilters(prompt);

    let matchedRecipeIds = null;

    // Nếu có tag → lọc món theo tag
    if (filters.tagIds.length > 0) {
      matchedRecipeIds = await RecipeTag.find({ tag_id: { $in: filters.tagIds } }).distinct('recipe_id');
    }

    // Nếu có nguyên liệu → lọc tiếp
    if (filters.includeIngredientIds.length > 0) {
      const recipeWithIngredients = await RecipeIngredient.find({ ingredient_id: { $in: filters.includeIngredientIds } }).distinct('recipe_id');
      matchedRecipeIds = matchedRecipeIds
        ? matchedRecipeIds.filter(id => recipeWithIngredients.includes(id.toString()))
        : recipeWithIngredients;
    }

    // Nếu có yêu cầu loại trừ nguyên liệu
    if (filters.excludeIngredientIds.length > 0) {
      const recipeExclude = await RecipeIngredient.find({ ingredient_id: { $in: filters.excludeIngredientIds } }).distinct('recipe_id');
      matchedRecipeIds = matchedRecipeIds
        ? matchedRecipeIds.filter(id => !recipeExclude.includes(id.toString()))
        : await Recipe.find({ _id: { $nin: recipeExclude } }).distinct('_id');
    }

    // Fallback: nếu không lọc được gì → lấy ngẫu nhiên
    const query = matchedRecipeIds && matchedRecipeIds.length > 0
      ? { _id: { $in: matchedRecipeIds } }
      : {}; // lấy tất cả nếu không lọc được

    // Truy vấn recipe

    const recipes = await Recipe.find(query).limit(100);

    if (recipes.length === 0) {
      const encoded = encodeURIComponent(prompt);
      const googleLink = `https://www.google.com/search?q=${encoded}`;
      return res.json({
        reply: `Tôi chưa tìm được món phù hợp, bạn có thể thử xem ở đây: [Xem trên Google](${googleLink})`
      });
    }

    const recipeList = recipes.map(r => `- ${r.title}`).join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'Bạn là trợ lý gợi ý món ăn thông minh, trả lời ngắn gọn và dễ hiểu bằng tiếng Việt.',
        },
        {
          role: 'user',
          content: `Người dùng hỏi: "${prompt}"\nMón ăn phù hợp:\n${recipeList}`
        }
      ],
      temperature: 0.7
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Lỗi GPT:', err.message);
    return res.status(500).json({ reply: 'Đã xảy ra lỗi khi xử lý, xin thử lại sau.' });
  }
});

module.exports = router;
