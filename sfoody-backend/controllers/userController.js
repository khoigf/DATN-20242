const User = require('../models/userModel');
const bcrypt = require('bcryptjs');

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

exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: 'Current password is incorrect' });
  }
  const hashed = await bcrypt.hash(newPassword, 10);
  user.password = hashed;
  await user.save();
  res.json({ message: 'Password updated successfully' });
}