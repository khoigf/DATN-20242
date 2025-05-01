const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    content: { type: String },
    status: { type: Number, default: 0 }
  });
  
module.exports = mongoose.model('Report', ReportSchema);
  