const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    name: { type: String, required: true, maxlength: 100 },
    category: { type: String, enum: ['meat', 'vegetable', 'spice', 'other'], default: 'other' }
  });
  
module.exports = mongoose.model('Ingredient', IngredientSchema);
  