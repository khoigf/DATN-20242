const mongoose = require('mongoose');

const RecipeSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, maxlength: 100 },
    description: { type: String },
    instruction: { type: String },
    prep_time: { type: Number },
    cook_time: { type: Number },
    servings: { type: Number },
    image_url: { type: String },
    video_url: { type: String },
    created_at: { type: Date, default: Date.now },
    status: { type: Number, default: 1 }
  });
  
module.exports = mongoose.model('Recipe', RecipeSchema);
  