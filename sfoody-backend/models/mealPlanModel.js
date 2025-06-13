const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['daily', 'weekly'], required: true },
  date: { type: Date, required: true },
  meals: [
    {
      meal_time: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
      recipe_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true }
    }
  ],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MealPlan', MealPlanSchema);
