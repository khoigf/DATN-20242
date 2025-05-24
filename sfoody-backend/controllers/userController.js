const User = require('../models/userModel');

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  // Format the avatar URL if it exists
  if (user.avatar_url) {
    user.avatar_url = `${process.env.IMAGE_URL}${user.avatar_url}`;
  }
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    const avatar = req.files?.avatar?.[0]?.filename || null;

    const updateData = { username, bio };

    if (avatar) {
      updateData.avatar_url = `/uploads/${avatar}`;
    }

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
