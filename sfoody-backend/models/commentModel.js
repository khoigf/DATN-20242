const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    rating: { type: Number, min: 1, max: 5 },
    content: { type: String },
    created_at: { type: Date, default: Date.now }
  });
  
  module.exports = mongoose.model('Comment', CommentSchema);
  