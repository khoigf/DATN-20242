const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, maxlength: 100 },
  password: { type: String, required: true, maxlength: 100 },
  avatar_url: { type: String },
  bio: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  verifyToken: String,
  isVerified: { type: Boolean, default: false },
  resetToken: String,
  resetTokenExpiry: Date,
  created_at: { type: Date, default: Date.now },
  status: { type: Number, default: 1 }
});

module.exports = mongoose.model('User', UserSchema);
