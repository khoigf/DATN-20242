const MealPlan = require('../models/mealPlanModel');
const Recipe = require('../models/recipeModel');
const Favorite = require('../models/favoriteModel');
const Tag = require('../models/tagModel');
const ingredients = require('../models/ingredientModel');

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
    const { user_id, type, date } = req.query;
    const plan = await MealPlan.findOne({ user_id, type, date }).populate('meals.recipe_id');
    res.status(200).json(plan);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMealPlanById = async (req, res) => {
  try {
    const plan = await MealPlan.findById(req.params.id).populate('meals.recipe_id');
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
    const { user_id, days = 7, constraints = {} } = req.body;
    const mealsPerDay = ['breakfast', 'lunch', 'dinner'];
    const result = [];
    const usedRecipeIds = new Set();

    const allTags = await Tag.find().lean();
    const getTagIdByName = (name) => allTags.find(t => t.name.toLowerCase() === name.toLowerCase())?._id?.toString();
    const getTagIdsByNames = (names) => names.map(getTagIdByName).filter(Boolean);

    const profileTagsMap = {
      gym: ['Nhiều protein', 'Tăng cơ'],
      sick: ['Ít chất béo', 'Tốt cho hệ tiêu hóa'],
      elder: ['Tốt cho tim mạch', 'Người cao tuổi'],
      child: ['Món ăn cho bé', 'Giàu vitamin'],
    };

    const balanceNutritionGroups = {
      meat: ['Bò', 'Lợn', 'Gà', 'Hải sản', 'Trứng', 'Cá'],
      veggie: ['Rau xanh', 'Củ', 'Trái cây'],
      carb: ['Giàu tinh bột', 'Ít tinh bột']
    };

    const profileTagIds = constraints.profile ? getTagIdsByNames(profileTagsMap[constraints.profile] || []) : [];

    const nutritionGroupTagIds = {};
    for (const group in balanceNutritionGroups) {
      nutritionGroupTagIds[group] = getTagIdsByNames(balanceNutritionGroups[group]);
    }

    const excludeTagIds = getTagIdsByNames(constraints.exclude_tags || []);
    const cookTimeTagId = constraints.max_cook_time ? getTagIdByName(constraints.max_cook_time) : null;

    const excludeIngredientNames = (constraints.exclude_ingredients || []).map(name => name.toLowerCase());

    const favorites = await Favorite.find({ user_id }).populate('recipe_id');
    const preferredTags = new Set();
    favorites.forEach(fav => {
      (fav.recipe_id.tags || []).forEach(tagId => preferredTags.add(tagId.toString()));
    });

    const allRecipes = await Recipe.find({ status: 1 }).populate('ingredients').lean();

    const filterRecipe = (recipe) => {
      // Hồ sơ
      if (constraints.profile && !recipe.tags?.some(t => profileTagIds.includes(t.toString()))) {
        return false;
      }

      // Dị ứng, loại tag
      if (excludeTagIds.length > 0 && recipe.tags?.some(t => excludeTagIds.includes(t.toString()))) {
        return false;
      }

      // Thời gian nấu
      if (cookTimeTagId && !recipe.tags?.includes(cookTimeTagId)) {
        return false;
      }

      // Loại nguyên liệu
      const hasExcludedIngredient = (recipe.ingredients || []).some(ing =>
        excludeIngredientNames.includes(ing.name.toLowerCase())
      );
      if (hasExcludedIngredient) return false;

      return true;
    };

    const pickBalancedRecipes = (available) => {
      const picks = [];
      const used = new Set();
      for (const group of ['carb', 'meat', 'veggie']) {
        const options = available.filter(
          r => !used.has(r._id.toString()) &&
          (r.tags || []).some(t => nutritionGroupTagIds[group].includes(t.toString()))
        );
        if (options.length > 0) {
          const random = options[Math.floor(Math.random() * options.length)];
          picks.push(random);
          used.add(random._id.toString());
        } else {
          picks.push(null); // fallback
        }
      }
      return picks;
    };

    const today = new Date();

    for (let i = 0; i < days; i++) {
      let available = allRecipes.filter(r =>
        !usedRecipeIds.has(r._id.toString()) &&
        filterRecipe(r)
      );

      if (preferredTags.size > 0) {
        available = available.sort((a, b) => {
          const aScore = (a.tags || []).filter(t => preferredTags.has(t.toString())).length;
          const bScore = (b.tags || []).filter(t => preferredTags.has(t.toString())).length;
          return bScore - aScore;
        });
      }

      let picked = [];
      if (constraints.balance) {
        picked = pickBalancedRecipes(available);
      } else {
        while (picked.length < 3 && available.length > 0) {
          const r = available[Math.floor(Math.random() * available.length)];
          if (!constraints.no_repeat || !usedRecipeIds.has(r._id.toString())) {
            picked.push(r);
            usedRecipeIds.add(r._id.toString());
          }
        }
      }

      picked.forEach(r => {
        if (r?._id) usedRecipeIds.add(r._id.toString());
      });

      result.push({
        user_id,
        type: constraints.type || 'daily',
        date: new Date(today.getTime() + i * 86400000),
        meals: ['breakfast', 'lunch', 'dinner'].map((meal_time, idx) => ({
          meal_time,
          recipe_id: picked[idx]?._id || null
        }))
      });
    }

    // 🔒 Nếu được yêu cầu thì mới lưu
    if (constraints.save === true) {
      const inserted = await MealPlan.insertMany(result);
      return res.status(201).json(inserted);
    }

    // Ngược lại chỉ trả về gợi ý
    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};