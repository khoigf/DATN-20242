const express = require('express');
const mongoose = require('mongoose');
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
  await loadCache();
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

    // ✅ Tag filtering (must match all tags)
    if (filters.tagIds.length > 0) {
      const recipeIdSets = await Promise.all(
        filters.tagIds.map(tagId =>
          RecipeTag.find({ tag_id: tagId }).distinct('recipe_id')
        )
      );
      
      // 2. Convert tất cả về string để so sánh an toàn
      const recipeIdStrSets = recipeIdSets.map(set =>
        set.map(id => id.toString())
      );

      // 3. Lấy giao nhau của tất cả tập
      matchedRecipeIds = recipeIdStrSets.reduce((acc, curr) =>
        acc.filter(id => curr.includes(id))
      );

      // 4. Convert lại ObjectId để truy vấn
      matchedRecipeIds = matchedRecipeIds.map(id => new mongoose.Types.ObjectId(id));
    }
    console.log('Matched recipe IDs after tag filtering:', matchedRecipeIds);
    console.log('Filters applied:', filters);
    // ✅ Include ingredient filtering
    if (filters.includeIngredientIds.length > 0) {
      const recipeWithIngredients = await RecipeIngredient.find({
        ingredient_id: { $in: filters.includeIngredientIds }
      }).distinct('recipe_id');

      matchedRecipeIds = matchedRecipeIds
        ? matchedRecipeIds.filter(id => recipeWithIngredients.includes(id.toString()))
        : recipeWithIngredients;
    }

    // ✅ Exclude ingredient filtering
    if (filters.excludeIngredientIds.length > 0) {
      const recipeToExclude = await RecipeIngredient.find({
        ingredient_id: { $in: filters.excludeIngredientIds }
      }).distinct('recipe_id');

      matchedRecipeIds = matchedRecipeIds
        ? matchedRecipeIds.filter(id => !recipeToExclude.includes(id.toString()))
        : await Recipe.find({ _id: { $nin: recipeToExclude } }).distinct('_id');
    }

    // 🔎 Truy vấn recipe cuối cùng
    if (matchedRecipeIds && matchedRecipeIds.length === 0) {
      return res.json({
        reply: '❌ Không tìm thấy món ăn nào phù hợp với tất cả yêu cầu của bạn. Vui lòng thử lại với yêu cầu khác.'
      });
    }

    let recipes;
    if (matchedRecipeIds && matchedRecipeIds.length > 0) {
      recipes = await Recipe.aggregate([
        { $match: { _id: { $in: matchedRecipeIds } } },
        { $limit: 100 },

        // Join recipe_tags → tags
        {
          $lookup: {
            from: 'recipetags',
            localField: '_id',
            foreignField: 'recipe_id',
            as: 'recipe_tags'
          }
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'recipe_tags.tag_id',
            foreignField: '_id',
            as: 'tags'
          }
        },

        // Join recipe_ingredients → ingredients
        {
          $lookup: {
            from: 'recipeingredients',
            localField: '_id',
            foreignField: 'recipe_id',
            as: 'recipe_ingredients'
          }
        },
        {
          $lookup: {
            from: 'ingredients',
            localField: 'recipe_ingredients.ingredient_id',
            foreignField: '_id',
            as: 'ingredients'
          }
        }
      ]);
    } else {
      recipes = await Recipe.aggregate([
        { $sample: { size: 100 } },

        {
          $lookup: {
            from: 'recipetags',
            localField: '_id',
            foreignField: 'recipe_id',
            as: 'recipe_tags'
          }
        },
        {
          $lookup: {
            from: 'tags',
            localField: 'recipe_tags.tag_id',
            foreignField: '_id',
            as: 'tags'
          }
        },
        {
          $lookup: {
            from: 'recipeingredients',
            localField: '_id',
            foreignField: 'recipe_id',
            as: 'recipe_ingredients'
          }
        },
        {
          $lookup: {
            from: 'ingredients',
            localField: 'recipe_ingredients.ingredient_id',
            foreignField: '_id',
            as: 'ingredients'
          }
        }
      ]);
    }
    // Gộp danh sách món ăn để gửi kèm prompt
    const recipeList = recipes.map(r => {
      const tagNames = (r.tags || []).map(tag => tag.name).join(', ');
      const ingredients = (r.ingredients || []).map(i => i.name).join(', ');
      return `- ${r.title}\n  Tags: ${tagNames}\n  Nguyên liệu: ${ingredients}`;
    }).join('\n\n');

    const userRequest = messages[messages.length - 1].content;
    const fullPrompt = `
${userRequest}

Dưới đây là danh sách các món ăn phù hợp với yêu cầu trên (có kèm tag và nguyên liệu):

${recipeList}

Hãy phân tích kỹ và chỉ gợi ý các món thật sự phù hợp với yêu cầu. Không gợi ý món không có trong danh sách này.
`.trim();

    const baseSystemPrompt = {
      role: 'system',
      content: `
Bạn là một đầu bếp tư vấn món ăn thông minh và thân thiện, có kiến thức sâu rộng về ẩm thực và dinh dưỡng.
Hãy trả lời các câu hỏi của người dùng bằng tiếng Việt một cách tự nhiên, dễ hiểu và đưa ra các gợi ý món ăn phù hợp với ngữ cảnh.
Khi gợi ý món ăn, hãy cân nhắc các yếu tố như sức khỏe, sở thích, nguyên liệu có sẵn, thời gian chuẩn bị và dịp cụ thể.
Không trả lời các câu hỏi ngoài lĩnh vực ẩm thực. Nếu không chắc chắn, hãy từ chối một cách lịch sự.
      `.trim()
    };

    const finalMessages = [baseSystemPrompt, { role: 'user', content: fullPrompt }];
    console.log('Final messages sent to OpenAI:', finalMessages);
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
