const Recipe = require('../models/recipeModel');
const RecipeTag = require('../models/recipeTagModel');
const RecipeIngredient = require('../models/recipeIngredient');
const Comment = require('../models/commentModel');
const client = require('../utils/searchClient');
const index = client.index('recipes');

exports.createRecipe = async (req, res) => {
  try {
    const {
      title, description, instruction, prep_time, cook_time, servings,
      tag_ids, ingredients
    } = req.body;

    const image = req.files.image?.[0]?.filename || null;
    const video = req.files.video?.[0]?.filename || null;

    const recipe = new Recipe({
      user_id: req.user.id,
      title,
      description,
      instruction,
      prep_time,
      cook_time,
      servings,
      image_url: image ? `/uploads/${image}` : undefined,
      video_url: video ? `/uploads/${video}` : undefined,
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

    await index.addDocuments([{
      id: recipe._id,
      title: recipe.title,
      description: recipe.description,
      tag_ids: parsedTags,
      user_id: recipe.user_id,
    }]);

    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({status: 1})
      .populate('user_id', 'username') // chỉ lấy trường name từ user
      .sort({ created_at: -1 }) // sắp xếp theo thời gian tạo mới nhất
    if (!recipes) return res.status(404).json({ message: 'Not found' });
    recipes.forEach(recipe => {
      recipe.image_url = recipe.image_url ? `${process.env.IMAGE_URL}${recipe.image_url}` : null;
      recipe.video_url = recipe.video_url ? `${process.env.IMAGE_URL}${recipe.video_url}` : null;
    });
    res.status(200).json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('user_id', 'username');
    if (!recipe) return res.status(404).json({ message: 'Not found' });

    recipe.image_url = recipe.image_url ? `${process.env.IMAGE_URL}${recipe.image_url}` : null;
    recipe.video_url = recipe.video_url ? `${process.env.IMAGE_URL}${recipe.video_url}` : null;

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
    const recipes = await Recipe.find({ user_id: req.user.id })
      .populate('user_id', 'username') // chỉ lấy trường name từ user
      .sort({ created_at: -1 }) // sắp xếp theo thời gian tạo mới nhất
    if (!recipes) return res.status(404).json({ message: 'Not found' });
    recipes.forEach(recipe => {
      recipe.image_url = recipe.image_url ? `${process.env.IMAGE_URL}${recipe.image_url}` : null;
      recipe.video_url = recipe.video_url ? `${process.env.IMAGE_URL}${recipe.video_url}` : null;
    });
    res.status(200).json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

exports.updateRecipe = async (req, res) => {
  try {
    const { tag_ids, ingredients } = req.body;

    // Xử lý ảnh/video nếu có upload mới
    const image = req.files?.image?.[0]?.filename || null;
    const video = req.files?.video?.[0]?.filename || null;

    if (image) {
      req.body.image_url = `/uploads/${image}`;
    }

    if (video) {
      req.body.video_url = `/uploads/${video}`;
    }

    // Cập nhật recipe chính
    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });

    // --- Xử lý tag nếu được gửi lên ---
    if (typeof tag_ids !== 'undefined') {
      await RecipeTag.deleteMany({ recipe_id: updated._id });

      const parsedTags = tag_ids ? JSON.parse(tag_ids) : [];

      await Promise.all(parsedTags.map(tagId =>
        RecipeTag.create({ recipe_id: updated._id, tag_id: tagId })
      ));
    }

    // --- Xử lý nguyên liệu nếu được gửi lên ---
    if (typeof ingredients !== 'undefined') {
      await RecipeIngredient.deleteMany({ recipe_id: updated._id });

      const parsedIngredients = ingredients ? JSON.parse(ingredients) : [];

      await Promise.all(parsedIngredients.map(item =>
        RecipeIngredient.create({
          recipe_id: updated._id,
          ingredient_id: item.ingredient_id,
          quantity: item.quantity
        })
      ));
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    await RecipeTag.deleteMany({ recipe_id: req.params.id });
    await RecipeIngredient.deleteMany({ recipe_id: req.params.id });
    await Comment.deleteMany({ recipe_id: req.params.id });
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
