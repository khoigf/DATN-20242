const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['ingredient', 'cooking_style', 'nutrition', 'region', 'occasion', 'cooking_time', 'other'], 
    default: 'other' 
  }
});

module.exports = mongoose.model('Tag', TagSchema);
