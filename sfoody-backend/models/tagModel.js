const mongoose = require('mongoose');

const TagSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, enum: ['ingredient', 'technique', 'diet', 'other'], default: 'other' }
  });
  
module.exports = mongoose.model('Tag', TagSchema);
  