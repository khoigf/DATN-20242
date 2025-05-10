const Recipe = require('../models/recipeModel');
const Comment = require('../models/commentModel');
const client = require('../utils/searchClient');
const index = client.index('recipes');

exports.createRecipe = async (req, res) => {
  try {
    const {
      title, description, instruction, prep_time, cook_time, servings,
    } = req.body;

    const image = req.files.image?.[0]?.filename;
    const video = req.files.video?.[0]?.filename;

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
    await index.addDocuments([{
      id: recipe._id,
      title: recipe.title,
      description: recipe.description,
      tag_ids: recipe.tag_ids,
      user_id: recipe.user_id,
    }]);
    await recipe.save();
    res.status(201).json(recipe);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllRecipes = async (req, res) => {
  try {
    const recipes = await Recipe.find({status: 1})
      .populate('user_id', 'name') // chỉ lấy trường name từ user
      .sort({ created_at: -1 }) // sắp xếp theo thời gian tạo mới nhất
    if (!recipes) return res.status(404).json({ message: 'Not found' });
    res.status(200).json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id).populate('user_id');
    if (!recipe) return res.status(404).json({ message: 'Not found' });

    // Lấy danh sách comment theo recipe_id và populate user
    const comments = await Comment.find({ recipe_id: req.params.id })
      .populate('user_id', 'name') // chỉ lấy trường name từ user

    // Tính điểm trung bình
    const ratings = comments.map(c => c.rating).filter(Boolean);
    const averageRating = ratings.length > 0
      ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
      : null;

    const formattedComments = comments.map(c => ({
        content: c.content,
        rating: c.rating,
        created_at: c.created_at,
        user: c.user_id // vì đã populate name rồi
    }));

    res.status(200).json({
      ...recipe.toObject(),
      comments: formattedComments,
      averageRating
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRecipe = async (req, res) => {
  try {
    const updated = await Recipe.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRecipe = async (req, res) => {
  try {
    await Recipe.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
