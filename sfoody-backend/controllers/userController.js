const User = require('../models/userModel');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  const { username, avatar_url, bio } = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, { username, avatar_url, bio }, { new: true });
  res.json(user);
};