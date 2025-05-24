const Recipe = require('../models/recipeModel');
const RecipeTag = require('../models/recipeTagModel');
const RecipeIngredient = require('../models/recipeIngredient');
const Comment = require('../models/commentModel');
const client = require('../utils/searchClient');
const index = client.index('recipes');
const fs = require('fs');
const path = require('path');

const getFullImageUrl = (imagePath) => {
  return imagePath ? `${process.env.IMAGE_URL}${imagePath}` : null;
};

exports.createRecipe = async (req, res) => {
  try {
    const {
      title, description, instruction, prep_time, cook_time, servings,
      tag_ids, ingredients, video_url
    } = req.body;

    const image = req.files.image?.[0]?.filename || null;

    const recipe = new Recipe({
      user_id: req.user.id,
      title,
      description,
      instruction,
      prep_time,
      cook_time,
      servings,
      image_url: image ? `/uploads/${image}` : undefined,
      video_url: video_url || null,
    });
    await recipe.save();

    const parsedTags = tag_ids ? JSON.parse(tag_ids) : [];
    const parsedIngredients = ingredients ? JSON.parse(ingredients) : [];

    await Promise.all(parsedTags.map(tagId => RecipeTag.create({ recipe_id: recipe._id, tag_id: tagId })));

    await Promise.all(parsedIngredients.map(item =>
      RecipeIngredient.create({
        recipe_id: recipe._id,
        ingredient_id: item.ingredient_id,
        quantity: item.quantity
      })
    ));

    // 🟡 Thêm vào Meilisearch
    const tagDocs = await RecipeTag.find({ recipe_id: recipe._id }).populate('tag_id');
    const ingredientDocs = await RecipeIngredient.find({ recipe_id: recipe._id }).populate('ingredient_id');

    const tagNames = tagDocs.map(t => t.tag_id?.name).filter(Boolean);

    await index.addDocuments([{
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
      status: 1,
      user_id: recipe.user_id.toString(),
      tags: tagNames, // dạng chuỗi
      ingredients: ingredientDocs.map(i => ({
        name: i.ingredient_id?.name || '',
        quantity: i.quantity || '',
        category: i.ingredient_id?.category || '',
      }))
    }]);

    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRecipes = async (req, res) => {
  try {
    const { search = '', page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      status: 1,
      ...(search && { title: { $regex: search, $options: 'i' } }),
    };

    const recipes = await Recipe.find(query)
      .populate('user_id', 'username')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    recipes.forEach(recipe => {
      recipe.image_url = recipe.image_url ? `${process.env.IMAGE_URL}${recipe.image_url}` : null;
      recipe.video_url = recipe.video_url || null;
    });

    const total = await Recipe.countDocuments(query);

    res.status(200).json({ recipes, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('user_id', 'username');
    if (!recipe) return res.status(404).json({ message: 'Not found' });

    recipe.image_url = recipe.image_url ? `${process.env.IMAGE_URL}${recipe.image_url}` : null;
    recipe.video_url = recipe.video_url ? recipe.video_url : null;

    // Lấy tags
    const recipeTags = await RecipeTag.find({ recipe_id: recipe._id }).populate('tag_id');
    const tags = recipeTags.map(rt => rt.tag_id); // chỉ lấy thông tin tag

    // Lấy nguyên liệu
    const recipeIngredients = await RecipeIngredient.find({ recipe_id: recipe._id }).populate('ingredient_id');
    const ingredients = recipeIngredients.map(ri => ({
      ...ri.ingredient_id.toObject(),
      quantity: ri.quantity
    }));

    // Lấy comment
    const comments = await Comment.find({ recipe_id: req.params.id }).populate('user_id', 'username');
    const ratings = comments.map(c => c.rating).filter(Boolean);
    const averageRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

    const formattedComments = comments.map(c => ({
      content: c.content,
      rating: c.rating,
      created_at: c.created_at,
      user_id: c.user_id
    }));

    // Trả kết quả
    res.status(200).json({
      ...recipe.toObject(),
      tags,
      ingredients,
      comments: formattedComments,
      averageRating
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecipesByUserId = async (req, res) => {
  try {
    const userId = req.user.id;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const filter = {
      user_id: userId,
      title: { $regex: search, $options: 'i' }
    };

    const total = await Recipe.countDocuments(filter);
    const recipes = await Recipe.find(filter)
      .populate('user_id', 'username')
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const enrichedRecipes = recipes.map(recipe => ({
      ...recipe._doc,
      image_url: recipe.image_url ? `${process.env.IMAGE_URL}${recipe.image_url}` : null,
      video_url: recipe.video_url || null
    }));

    res.status(200).json({ recipes: enrichedRecipes, total });
  } catch (err) {
    console.error('Lỗi getRecipesByUserId:', err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const { tag_ids, ingredients, video_url } = req.body;

    // --- Xử lý ảnh/video nếu có upload ---
    const image = req.files?.image?.[0]?.filename || null;

    if (image) {
      req.body.image_url = `/uploads/${image}`;
    }

    if (video_url) {
      req.body.video_url = video_url;
    }
    // --- Cập nhật recipe chính ---
    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // --- Xử lý tag_ids từ FormData ---
    if (typeof tag_ids !== 'undefined') {
      await RecipeTag.deleteMany({ recipe_id: updated._id });

      let parsedTags = [];
      if (Array.isArray(tag_ids)) {
        parsedTags = tag_ids;
      } else {
        parsedTags = [tag_ids]; // Trường hợp chỉ gửi 1 tag
      }

      await Promise.all(parsedTags.map(tagId =>
        RecipeTag.create({ recipe_id: updated._id, tag_id: tagId })
      ));
    }

    // --- Xử lý ingredients từ FormData ---
    if (typeof ingredients !== 'undefined') {
      await RecipeIngredient.deleteMany({ recipe_id: updated._id });

      let parsedIngredients = [];

      if (Array.isArray(ingredients)) {
        parsedIngredients = ingredients.map(item => {
          try {
            return JSON.parse(item);
          } catch (e) {
            return null;
          }
        }).filter(Boolean);
      } else if (typeof ingredients === 'string') {
        try {
          const single = JSON.parse(ingredients);
          parsedIngredients = Array.isArray(single) ? single : [single];
        } catch (e) {
          parsedIngredients = [];
        }
      }

      await Promise.all(parsedIngredients.map(item =>
        RecipeIngredient.create({
          recipe_id: updated._id,
          ingredient_id: item.id,
          quantity: item.quantity
        })
      ));
    }

    // 🟡 Cập nhật Meilisearch
    const tagDocs = await RecipeTag.find({ recipe_id: updated._id }).populate('tag_id');
    const ingredientDocs = await RecipeIngredient.find({ recipe_id: updated._id }).populate('ingredient_id');

    const tagNames = tagDocs.map(t => t.tag_id?.name).filter(Boolean);

    await index.updateDocuments([{
      id: updated._id.toString(),
      title: updated.title,
      description: updated.description,
      instruction: updated.instruction,
      prep_time: updated.prep_time,
      cook_time: updated.cook_time,
      servings: updated.servings,
      image_url: getFullImageUrl(updated.image_url),
      video_url: updated.video_url,
      created_at: updated.created_at,
      status: 1,
      user_id: updated.user_id.toString(),
      tags: tagNames, // dạng chuỗi
      ingredients: ingredientDocs.map(i => ({
        name: i.ingredient_id?.name || '',
        quantity: i.quantity || '',
        category: i.ingredient_id?.category || '',
      }))
    }]);

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    await Recipe.findByIdAndDelete(req.params.id);
    await RecipeTag.deleteMany({ recipe_id: req.params.id });
    await RecipeIngredient.deleteMany({ recipe_id: req.params.id });
    await Comment.deleteMany({ recipe_id: req.params.id });

    await index.deleteDocument(req.params.id);
    // Xóa ảnh nếu có
    if (recipe && recipe.image_url) {
      const imagePath = path.join(__dirname, '..', 'uploads', path.basename(recipe.image_url));
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image:', err);
      }
      );
    }
    
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
