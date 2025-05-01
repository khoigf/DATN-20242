const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendVerificationEmail, sendResetEmail } = require('../utils/mailer');

exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: 'Email đã tồn tại' });

    const hashed = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');

    const user = new User({ username, email, password: hashed, verifyToken });
    await user.save();

    await sendVerificationEmail(email, verifyToken);
    res.status(201).json({ msg: 'Đăng ký thành công, vui lòng kiểm tra email để xác minh' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  const { token } = req.query;
  const user = await User.findOne({ verifyToken: token });
  if (!user) return res.status(400).json({ msg: 'Token không hợp lệ' });

  user.isVerified = true;
  user.verifyToken = null;
  await user.save();

  res.json({ msg: 'Xác minh email thành công' });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'Không tìm thấy người dùng' });

    if (!user.isVerified) return res.status(403).json({ msg: 'Vui lòng xác minh email trước khi đăng nhập' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: 'Sai mật khẩu' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ msg: 'Email không tồn tại' });

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = Date.now() + 3600000;
  await user.save();

  await sendResetEmail(user.email, token);
  res.json({ msg: 'Email đặt lại mật khẩu đã được gửi' });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ msg: 'Token không hợp lệ hoặc đã hết hạn' });

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetToken = null;
  user.resetTokenExpiry = null;
  await user.save();

  res.json({ msg: 'Đặt lại mật khẩu thành công' });
};

exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
