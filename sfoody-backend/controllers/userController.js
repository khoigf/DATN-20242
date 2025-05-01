const User = require('../models/userModel');
const Recipe = require('../models/recipeModel');
const Favorite = require('../models/favoriteModel');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const { username, avatar_url, bio } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { username, avatar_url, bio }, { new: true });
  res.json(user);
};

exports.getUserPosts = async (req, res) => {
  const posts = await Recipe.find({ user_id: req.user.id });
  res.json(posts);
};

exports.getFavorites = async (req, res) => {
  const favs = await Favorite.find({ user_id: req.user.id }).populate('recipe_id');
  res.json(favs);
};

exports.removeFavorite = async (req, res) => {
  await Favorite.findOneAndDelete({ user_id: req.user.id, recipe_id: req.params.recipeId });
  res.json({ msg: 'Removed from favorites' });
};
