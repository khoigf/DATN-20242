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
  const { messages, filters: incomingFilters } = req.body;
  if (!messages || messages.length === 0) return res.status(400).json({ message: 'Thiếu messages' });

  try {
    const filters = incomingFilters || await extractFilters(messages[messages.length - 1].content);

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

    const recipes = await Recipe.find(query).limit(100);
    const recipeList = recipes.map(r => `- ${r.title}`).join('\n');

    // Gắn danh sách món ăn vào messages
    messages.push({
      role: 'user',
      content: `Danh sách món ăn có thể phù hợp:\n${recipeList}\nTrả lời dựa trên thông tin này. Nếu món ăn không có trong danh sách hãy gợi ý món ăn ngoài cũng được. Nếu câu hỏi không liên quan đến món ăn, hãy trả lời chung chung và gợi ý người dùng có muốn hỏi gì về món ăn không.`,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    });

    const reply = response.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error('Lỗi GPT:', err.message);
    return res.status(500).json({ reply: 'Đã xảy ra lỗi khi xử lý, xin thử lại sau.' });
  }
});

module.exports = router;
