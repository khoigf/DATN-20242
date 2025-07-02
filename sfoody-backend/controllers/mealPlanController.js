const MealPlan = require('../models/mealPlanModel');
const Recipe = require('../models/recipeModel');
const Favorite = require('../models/favoriteModel');
const Tag = require('../models/tagModel');
const RecipeTag = require('../models/recipeTagModel');
const Ingredient = require('../models/ingredientModel');
const RecipeIngredient = require('../models/recipeIngredient');

exports.createMealPlan = async (req, res) => {
  try {
    const plan = await MealPlan.create(req.body);
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMealPlan = async (req, res) => {
  try {
    const { type, date } = req.query;

    let query = {};
    query.user_id = req.user.id;
    if (type) query.type = type;
    if (date) query.date = date;

    const plans = await MealPlan.find(query).sort({ createdAt: -1 });
    res.status(200).json(plans);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMealPlanById = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id);
    if (!plan) return res.status(404).json({ message: 'Meal plan not found' });
    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateMealPlan = async (req, res) => {
  try {
    const updated = await MealPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: 'Meal plan not found' });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteMealPlan = async (req, res) => {
  try {
    const deleted = await MealPlan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Meal plan not found' });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.suggestMealPlan = async (req, res) => {
  try {
    const { days = 7, constraints = {} } = req.body;
    const mealsPerDay = ['breakfast', 'lunch', 'dinner'];
    const result = [];
    const usedRecipeIds = new Set();
    const user_id = req.user.id;

    // Load tags
    const allTags = await Tag.find().lean();
    const tagByName = {};
    allTags.forEach(tag => {
      tagByName[tag.name.toLowerCase()] = tag;
    });
    const getTagId = (name) => tagByName[name.toLowerCase()]?._id?.toString();

    // Nutrition group map
    const balanceNutritionGroups = {
      carb: ['Giàu tinh bột'],
      meat: ['Bò', 'Gà', 'Hải sản', 'Cá', 'Trứng', 'Lợn', 'Thịt rừng'],
      veggie: ['Rau xanh', 'Củ', 'Trái cây', 'Giàu chất xơ'],
    };
    const nutritionGroupLabels = {
      carb: 'Tinh bột',
      meat: 'Chất đạm',
      veggie: 'Chất xơ'
    };
    const nutritionGroupTagIds = {};
    for (let group in balanceNutritionGroups) {
      nutritionGroupTagIds[group] = balanceNutritionGroups[group].map(getTagId).filter(Boolean);
    }

    // User profile constraints
    const profileTagsMap = {
      gym: ['Nhiều protein', 'Tăng cơ'],
      sick: ['Ít chất béo', 'Tốt cho hệ tiêu hóa'],
      elder: ['Tốt cho tim mạch', 'Người cao tuổi'],
      child: ['Món ăn cho bé', 'Giàu vitamin'],
    };
    const profileTagIds = constraints.profile ? profileTagsMap[constraints.profile]?.map(getTagId).filter(Boolean) : [];
    const excludeTagIds = (constraints.exclude_tags || []).map(String);
    const excludedIngredientIds = (constraints.exclude_ingredients || []).map(String);
    const cookTimeTagId = constraints.max_cook_time ? getTagId(constraints.max_cook_time) : null;

    // Load recipes
    const allRecipes = await Recipe.find({ status: 1 }).lean();
    const recipeIds = allRecipes.map(r => r._id.toString());

    const allRecipeTags = await RecipeTag.find({ recipe_id: { $in: recipeIds } }).lean();
    const recipeTagMap = {};
    allRecipeTags.forEach(rt => {
      const rid = rt.recipe_id.toString();
      const tid = rt.tag_id.toString();
      if (!recipeTagMap[rid]) recipeTagMap[rid] = [];
      recipeTagMap[rid].push(tid);
    });

    const allRecipeIngredients = await RecipeIngredient.find({ recipe_id: { $in: recipeIds } }).lean();
    const recipeIngMap = {};
    allRecipeIngredients.forEach(ri => {
      const rid = ri.recipe_id.toString();
      recipeIngMap[rid] = recipeIngMap[rid] || [];
      recipeIngMap[rid].push(ri.ingredient_id.toString());
    });

    // Kiểm tra điều kiện từng công thức
    const filterRecipe = (r) => {
      const rid = r._id.toString();
      const tags = recipeTagMap[rid] || [];
      const ingIds = recipeIngMap[rid] || [];

      if (profileTagIds.length && !tags.some(t => profileTagIds.includes(t))) return false;
      if (cookTimeTagId && !tags.includes(cookTimeTagId)) return false;
      if (excludedIngredientIds.length && ingIds.some(i => excludedIngredientIds.includes(i))) return false;

      return true;
    };

    const getNutritionTags = (tagIds = []) => {
      const result = [];
      for (const [group, ids] of Object.entries(nutritionGroupTagIds)) {
        if (tagIds.some(tid => ids.includes(tid))) result.push(group);
      }
      return result;
    };

    const today = new Date();

    for (let i = 0; i < days; i++) {
      const dayDate = new Date(today.getTime() + i * 86400000);
      const dailyMeals = [];

      for (let mealTime of mealsPerDay) {
        const available = allRecipes.filter(r => {
          const rid = r._id.toString();
          if (usedRecipeIds.has(rid) && constraints.no_repeat) return false;
          return filterRecipe(r);
        });

        let pick = null;
        let nutrition_tags = [];
        let reason = null;

        // Ưu tiên món đủ cả 3 nhóm
        const perfectMatches = available.filter(r => {
          const tags = recipeTagMap[r._id.toString()] || [];
          const matched = getNutritionTags(tags);
          return matched.length === 3;
        });

        if (perfectMatches.length > 0) {
          pick = perfectMatches[Math.floor(Math.random() * perfectMatches.length)];
          nutrition_tags = getNutritionTags(recipeTagMap[pick._id.toString()]).map(group => nutritionGroupLabels[group]);;
        } else {
          // fallback: >= 2 nhóm
          const partialMatches = available.filter(r => {
            const tags = recipeTagMap[r._id.toString()] || [];
            const matched = getNutritionTags(tags);
            return matched.length >= 2;
          });
          if (partialMatches.length > 0) {
            pick = partialMatches[Math.floor(Math.random() * partialMatches.length)];
            nutrition_tags = getNutritionTags(recipeTagMap[pick._id.toString()]).map(group => nutritionGroupLabels[group]);
            console.log(`Chọn món ${pick.title} cho ${mealTime} (${nutrition_tags.join(', ')})`);
            reason = 'Không có món đủ 3 nhóm, dùng món đủ 2 nhóm';
            if (!nutrition_tags.includes('Tinh bột')) {
              reason += ' (Thiếu tinh bột, nên ăn kèm cơm hoặc bún)';
            }
          } else {
            reason = 'Không có món phù hợp (ít nhất 2 nhóm dinh dưỡng)';
          }
        }

        if (pick) usedRecipeIds.add(pick._id.toString());
        if (pick && pick.image_url) {
          pick.image_url = "http://localhost:8080" + (pick.image_url);
        }
        dailyMeals.push({
          meal_time: mealTime,
          recipe_id: pick?._id || null,
          recipe: pick || null,
          title: pick?.title || null,
          nutrition_tags,
          reason,
        });
      }

      result.push({
        user_id,
        type: constraints.type || 'daily',
        date: dayDate,
        meals: dailyMeals,
      });
    }

    if (constraints.save) {
      const inserted = await MealPlan.insertMany(result);
      return res.status(201).json(inserted);
    }

    return res.status(200).json(result);
  } catch (e) {
    console.error('❌ Error in suggestMealPlan:', e);
    res.status(500).json({ message: e.message });
  }
};