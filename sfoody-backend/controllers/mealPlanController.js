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
    // Load all tags và tạo map
    const allTags = await Tag.find().lean();
    const tagByName = {};
    allTags.forEach(tag => {
      tagByName[tag.name.toLowerCase()] = tag;
    });
    const getTagId = (name) => tagByName[name.toLowerCase()]?._id?.toString();

    // Profile và nhóm dinh dưỡng
    const profileTagsMap = {
      gym: ['Nhiều protein', 'Tăng cơ'],
      sick: ['Ít chất béo', 'Tốt cho hệ tiêu hóa'],
      elder: ['Tốt cho tim mạch', 'Người cao tuổi'],
      child: ['Món ăn cho bé', 'Giàu vitamin'],
    };
    const balanceNutritionGroups = {
      carb: ['Giàu tinh bột', 'Ít tinh bột'],
      meat: ['Bò', 'Gà', 'Hải sản', 'Cá', 'Trứng'],
      veggie: ['Rau xanh', 'Củ', 'Trái cây'],
    };

    const profileTagIds = constraints.profile ? profileTagsMap[constraints.profile]?.map(getTagId).filter(Boolean) : [];
    const excludeTagIds = (constraints.exclude_tags || []).map(String);
    const excludedIngredientIds = (constraints.exclude_ingredients || []).map(String);
    const cookTimeTagId = constraints.max_cook_time ? getTagId(constraints.max_cook_time) : null;

    // Load công thức
    const allRecipes = await Recipe.find({ status: 1 }).lean();
    const recipeIds = allRecipes.map(r => r._id.toString());

    // Load tag gắn với từng công thức
    const allRecipeTags = await RecipeTag.find({ recipe_id: { $in: recipeIds } }).lean();
    const recipeTagMap = {};
    allRecipeTags.forEach(rt => {
      const rid = rt.recipe_id.toString();
      const tid = rt.tag_id.toString();
      if (!recipeTagMap[rid]) recipeTagMap[rid] = [];
      recipeTagMap[rid].push(tid);
    });

    // Load nguyên liệu gắn với công thức
    const allRecipeIngredients = await RecipeIngredient.find({ recipe_id: { $in: recipeIds } }).lean();
    const recipeIngMap = {};
    allRecipeIngredients.forEach(ri => {
      const rid = ri.recipe_id.toString();
      recipeIngMap[rid] = recipeIngMap[rid] || [];
      recipeIngMap[rid].push(ri.ingredient_id.toString());
    });

    const filterRecipe = (r) => {
      const rid = r._id.toString();
      const tags = recipeTagMap[rid] || [];
      const ingIds = recipeIngMap[rid] || [];

      if (profileTagIds.length && !tags.some(t => profileTagIds.includes(t))) return false;
      if (cookTimeTagId && !tags.includes(cookTimeTagId)) return false;
      if (excludedIngredientIds.length && ingIds.some(i => excludedIngredientIds.includes(i))) return false;

      return true;
    };

    const nutritionGroupTagIds = {};
    for (let group in balanceNutritionGroups) {
      nutritionGroupTagIds[group] = balanceNutritionGroups[group].map(getTagId).filter(Boolean);
    }

    const isBalanced = constraints.balance === true;

    const pickBalanced = (available) => {
      const used = new Set(), picks = [], selected = {};

      for (let group of ['carb', 'meat', 'veggie']) {
        const options = available.filter(r => {
          const tags = recipeTagMap[r._id.toString()] || [];
          return !used.has(r._id.toString()) && tags.some(t => nutritionGroupTagIds[group].includes(t));
        });
        if (options.length) {
          const pick = options[Math.floor(Math.random() * options.length)];
          selected[group] = pick;
          used.add(pick._id.toString());
        }
      }

      for (let g of ['carb', 'meat', 'veggie']) {
        if (selected[g]) picks.push(selected[g]);
      }

      while (picks.length < 3) {
        const remaining = available.filter(r => !used.has(r._id.toString()));
        if (!remaining.length) break;
        const pick = remaining[Math.floor(Math.random() * remaining.length)];
        picks.push(pick);
        used.add(pick._id.toString());
      }

      return picks;
    };

    const today = new Date();

    for (let i = 0; i < days; i++) {
      let available = allRecipes.filter(r => !usedRecipeIds.has(r._id.toString()) && filterRecipe(r));
      console.log(`📆 Ngày ${i + 1}: Có ${available.length} công thức hợp lệ`);

      let picks = isBalanced ? pickBalanced(available) : [];

      if (!isBalanced) {
        while (picks.length < 3 && available.length) {
          const pick = available.shift();
          if (!constraints.no_repeat || !usedRecipeIds.has(pick._id.toString())) {
            picks.push(pick);
            usedRecipeIds.add(pick._id.toString());
          }
        }
      }

      while (picks.length < 3) {
        const fallback = allRecipes.filter(r => !usedRecipeIds.has(r._id.toString()) && filterRecipe(r));
        if (!fallback.length) break;
        const pick = fallback[Math.floor(Math.random() * fallback.length)];
        picks.push(pick);
        usedRecipeIds.add(pick._id.toString());
      }

      console.log('🍽️ Picks:', picks.map(p => p?.title || p?._id));

      result.push({
        user_id,
        type: constraints.type || 'daily',
        date: new Date(today.getTime() + i * 86400000),
        meals: mealsPerDay.map((mt, idx) => ({
          meal_time: mt,
          recipe_id: picks[idx]?._id || null
        }))
      });
    }

    if (constraints.save) {
      const inserted = await MealPlan.insertMany(result);
      return res.status(201).json(inserted);
    }

    res.status(200).json(result);
  } catch (e) {
    console.error('❌ Error in suggestMealPlan:', e);
    res.status(500).json({ message: e.message });
  }
};