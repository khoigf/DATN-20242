const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');

const Tag = require('../models/tagModel');
const Ingredient = require('../models/ingredientModel');
const Recipe = require('../models/recipeModel');
const RecipeTag = require('../models/recipeTagModel');
const RecipeIngredient = require('../models/recipeIngredient');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Caching tags and ingredients to avoid frequent DB hits
let tagCache = null;
let ingredientCache = null;
let cacheTime = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function loadCache() {
  const now = Date.now();
  if (!tagCache || !ingredientCache || now - cacheTime > CACHE_TTL) {
    tagCache = await Tag.find({});
    ingredientCache = await Ingredient.find({});
    cacheTime = now;
  }
}

// Hàm tìm tag và ingredient trong câu hỏi
async function extractFilters(prompt) {
  await loadCache(); // ensure cache is loaded
  const filters = {
    tagIds: [],
    excludeIngredientIds: [],
    includeIngredientIds: []
  };

  const promptLower = prompt.toLowerCase();

  for (const tag of tagCache) {
    if (promptLower.includes(tag.name.toLowerCase())) {
      filters.tagIds.push(tag._id);
    }
  }

  for (const ing of ingredientCache) {
    const name = ing.name.toLowerCase();
    const index = promptLower.indexOf(name);
    if (index !== -1) {
      const context = promptLower.slice(Math.max(0, index - 20), index + name.length + 20);
      if (/không|tránh|dị ứng|loại/i.test(context)) {
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
  if (!messages || messages.length === 0) {
    return res.status(400).json({ message: 'Thiếu messages' });
  }

  try {
    const latestMessage = messages[messages.length - 1].content;
    const filters = incomingFilters || await extractFilters(latestMessage);

    let matchedRecipeIds = null;

    // Tag filtering
    if (filters.tagIds.length > 0) {
      matchedRecipeIds = await RecipeTag.find({ tag_id: { $in: filters.tagIds } }).distinct('recipe_id');
    }

    // Include ingredient filtering
    if (filters.includeIngredientIds.length > 0) {
      const recipeWithIngredients = await RecipeIngredient.find({
        ingredient_id: { $in: filters.includeIngredientIds }
      }).distinct('recipe_id');

      matchedRecipeIds = matchedRecipeIds
        ? matchedRecipeIds.filter(id => recipeWithIngredients.includes(id.toString()))
        : recipeWithIngredients;
    }

    // Exclude ingredient filtering
    if (filters.excludeIngredientIds.length > 0) {
      const recipeToExclude = await RecipeIngredient.find({
        ingredient_id: { $in: filters.excludeIngredientIds }
      }).distinct('recipe_id');

      matchedRecipeIds = matchedRecipeIds
        ? matchedRecipeIds.filter(id => !recipeToExclude.includes(id.toString()))
        : await Recipe.find({ _id: { $nin: recipeToExclude } }).distinct('_id');
    }

    let recipes;
    if (matchedRecipeIds && matchedRecipeIds.length > 0) {
      recipes = await Recipe.find({ _id: { $in: matchedRecipeIds } }).limit(100);
    } else {
      // fallback random sample
      recipes = await Recipe.aggregate([{ $sample: { size: 10 } }]);
    }

    const recipeList = recipes.map(r => `- ${r.title}`).join('\n');

    messages.push({
      role: 'user',
      content:
        `Danh sách món ăn có thể phù hợp:\n${recipeList}\n` +
        `Trả lời đưa ra các món ăn dựa trên danh sách này. Nếu món ăn không có trong danh sách, có thể gợi ý món khác ngoài danh sách`
    });

    const baseSystemPrompt = {
      role: 'system',
      content: `
    Bạn là một đầu bếp tư vấn món ăn thông minh và thân thiện, có kiến thức sâu rộng về ẩm thực và dinh dưỡng.
    Hãy trả lời các câu hỏi của người dùng bằng tiếng Việt một cách tự nhiên, dễ hiểu và đưa ra các gợi ý món ăn phù hợp với ngữ cảnh.
    Khi gợi ý món ăn, hãy cân nhắc các yếu tố như sức khỏe, sở thích, nguyên liệu có sẵn, thời gian chuẩn bị và dịp cụ thể.
    Không trả lời các câu hỏi ngoài lĩnh vực ẩm thực. Nếu không chắc chắn, hãy từ chối một cách lịch sự.
      `.trim()
    };

    // Thêm vào đầu messages nếu chưa có
    const finalMessages = [baseSystemPrompt, ...messages];

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: finalMessages,
      temperature: 0.7,
      max_tokens: 500
    });

    const reply = response?.choices?.[0]?.message?.content;
    if (!reply) {
      throw new Error('OpenAI không trả về kết quả phù hợp');
    }

    return res.json({ reply });

  } catch (err) {
    console.error('Lỗi xử lý GPT:', err);
    return res.status(500).json({ reply: '❌ Đã xảy ra lỗi trong quá trình xử lý, vui lòng thử lại sau.' });
  }
});

module.exports = router;
