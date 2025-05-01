const mongoose = require('mongoose');

const RecipeIngredientSchema = new mongoose.Schema({
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    ingredient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Ingredient', required: true },
    quantity: { type: String }
  });
  
module.exports = mongoose.model('RecipeIngredient', RecipeIngredientSchema);
