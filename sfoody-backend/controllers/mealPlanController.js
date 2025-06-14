const MealPlan = require('../models/mealPlanModel');
const Recipe = require('../models/recipeModel');
const Favorite = require('../models/favoriteModel');
const Tag = require('../models/tagModel');
const ingredients = require('../models/ingredientModel');
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
    const result = [];
    const usedRecipeIds = new Set();

    const allTags = await Tag.find().lean();
    const allRecipes = await Recipe.find({ status: 1 }).lean();
    const favorites = await Favorite.find({ user_id }).populate('recipe_id');

    const getTagIdByName = (name) => allTags.find(t => t.name.toLowerCase() === name.toLowerCase())?._id?.toString();
    const getTagIdsByNames = (names) => names.map(getTagIdByName).filter(Boolean);

    const profileTagsMap = {
      gym: ['Nhiều protein', 'Tăng cơ'],
      sick: ['Ít chất béo', 'Tốt cho hệ tiêu hóa'],
      elder: ['Tốt cho tim mạch', 'Người cao tuổi'],
      child: ['Món ăn cho bé', 'Giàu vitamin'],
    };

    const nutritionGroups = {
      meat: ['Bò', 'Lợn', 'Gà', 'Hải sản', 'Trứng', 'Cá'],
      veggie: ['Rau xanh', 'Củ', 'Trái cây'],
      carb: ['Giàu tinh bột', 'Ít tinh bột']
    };
    const nutritionGroupTagIds = {};
    for (const group in nutritionGroups) {
      nutritionGroupTagIds[group] = getTagIdsByNames(nutritionGroups[group]);
    }

    const profileTagIds = constraints.profile ? getTagIdsByNames(profileTagsMap[constraints.profile] || []) : [];
    const excludeTagIds = getTagIdsByNames(constraints.exclude_tags || []);
    const cookTimeTagId = constraints.max_cook_time ? getTagIdByName(constraints.max_cook_time) : null;
    const excludeIngredientNames = (constraints.exclude_ingredients || []).map(name => name.toLowerCase());

    const preferredTags = new Set();
    favorites.forEach(fav => {
      (fav.recipe_id?.tags || []).forEach(tagId => preferredTags.add(tagId.toString()));
    });

    const favoriteRecipes = favorites.map(fav => fav.recipe_id).filter(Boolean);

    const isBalanced = typeof constraints.balance === 'boolean' ? constraints.balance : true;

    const filterRecipe = (recipe) => {
      if (constraints.profile && !recipe.tags?.some(t => profileTagIds.includes(t.toString()))) return false;
      if (excludeTagIds.length > 0 && recipe.tags?.some(t => excludeTagIds.includes(t.toString()))) return false;
      if (cookTimeTagId && !recipe.tags?.includes(cookTimeTagId)) return false;
      if (excludeIngredientNames.length > 0 && recipe.ingredients?.some(ing =>
        excludeIngredientNames.includes(ing.name.toLowerCase()))) return false;
      return true;
    };

    const getFallbackRecipe = (pickedIds) => {
      const fallbackPool = allRecipes.filter(r =>
        !pickedIds.has(r._id.toString()) &&
        !excludeTagIds.includes(r.tags) &&
        !excludeIngredientNames.some(name =>
          r.ingredients?.some(ing => ing.name.toLowerCase() === name)
        )
      );
      if (fallbackPool.length > 0) {
        const r = fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
        pickedIds.add(r._id.toString());
        return r;
      }
      return null;
    };

    const pickBalancedRecipes = (available, pickedIds) => {
      const picks = [];
      for (const group of ['carb', 'meat', 'veggie']) {
        const options = available.filter(r =>
          !pickedIds.has(r._id.toString()) &&
          (r.tags || []).some(t => nutritionGroupTagIds[group].includes(t.toString()))
        );
        if (options.length > 0) {
          const r = options[Math.floor(Math.random() * options.length)];
          picks.push(r);
          pickedIds.add(r._id.toString());
        } else {
          // fallback: ưu tiên món yêu thích
          const favOptions = favoriteRecipes.filter(r =>
            !pickedIds.has(r._id.toString()) &&
            (r.tags || []).some(t => nutritionGroupTagIds[group].includes(t.toString()))
          );
          if (favOptions.length > 0) {
            const r = favOptions[Math.floor(Math.random() * favOptions.length)];
            picks.push(r);
            pickedIds.add(r._id.toString());
          } else {
            picks.push(getFallbackRecipe(pickedIds));
          }
        }
      }
      return picks;
    };

    const today = new Date();

    for (let i = 0; i < days; i++) {
      const pickedIds = new Set();

      let available = allRecipes.filter(r =>
        !usedRecipeIds.has(r._id.toString()) &&
        filterRecipe(r)
      );

      if (preferredTags.size > 0) {
        available.sort((a, b) => {
          const aScore = (a.tags || []).filter(t => preferredTags.has(t.toString())).length;
          const bScore = (b.tags || []).filter(t => preferredTags.has(t.toString())).length;
          return bScore - aScore;
        });
      }

      let picked = [];

      if (isBalanced) {
        picked = pickBalancedRecipes(available, pickedIds);
      } else {
        while (picked.length < 3 && available.length > 0) {
          const r = available[Math.floor(Math.random() * available.length)];
          if (!constraints.no_repeat || !usedRecipeIds.has(r._id.toString())) {
            picked.push(r);
            pickedIds.add(r._id.toString());
          }
        }

        // fallback nếu chưa đủ
        while (picked.length < 3) {
          let fallback = favoriteRecipes.find(r => !pickedIds.has(r._id.toString()));
          if (!fallback) fallback = getFallbackRecipe(pickedIds);
          if (!fallback) break;
          picked.push(fallback);
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

    if (constraints.save === true) {
      const inserted = await MealPlan.insertMany(result);
      return res.status(201).json(inserted);
    }

    res.status(200).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};