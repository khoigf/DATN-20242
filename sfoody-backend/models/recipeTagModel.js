const mongoose = require('mongoose');

const RecipeTagSchema = new mongoose.Schema({
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    tag_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Tag', required: true }
  });
  
module.exports = mongoose.model('RecipeTag', RecipeTagSchema);
