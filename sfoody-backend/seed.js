const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGODB_URI = "mongodb+srv://root:8KPVZpgNIqnIq2gP@cluster0.ipujnzr.mongodb.net/Sfoody";

// Import models
const Recipe = require('./models/recipeModel');
const Ingredient = require('./models/ingredientModel');
const RecipeIngredient = require('./models/recipeIngredient');
const Tag = require('./models/tagModel');
const RecipeTag = require('./models/recipeTagModel');

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB Atlas");

    await Promise.all([
      Recipe.deleteMany(),
      Ingredient.deleteMany(),
      RecipeIngredient.deleteMany(),
      Tag.deleteMany(),
      RecipeTag.deleteMany()
    ]);

    const data = fs.readFileSync(path.join(__dirname, 'seed', 'real_vietnamese_recipes_with_steps.json'), 'utf-8');
    const recipeJson = JSON.parse(data);

    const ingredientMap = new Map();
    const tagMap = new Map();

    const ingredientDocs = [];
    const tagDocs = [];
    const recipeDocs = [];
    const recipeIngredientDocs = [];
    const recipeTagDocs = [];

    // Simulate user_id for all recipes
    const fakeUserId = '68139a5b22d1a0c7e9832086';
    for (const recipe of recipeJson) {
      const recipeId = new mongoose.Types.ObjectId();

      // Add ingredients
      for (const ing of recipe.ingredients) {
        const key = ing.name.toLowerCase();
        if (!ingredientMap.has(key)) {
          const ingDoc = new Ingredient({
            name: ing.name,
            category: ing.category
          });
          ingredientMap.set(key, ingDoc);
          ingredientDocs.push(ingDoc);
        }

        const ingredientId = ingredientMap.get(key)._id;

        recipeIngredientDocs.push(new RecipeIngredient({
          recipe_id: recipeId,
          ingredient_id: ingredientId,
          quantity: ing.quantity
        }));
      }

      // Add tags
      for (const tag of recipe.tags) {
        const key = tag.name.toLowerCase();
        if (!tagMap.has(key)) {
          const tagDoc = new Tag({
            name: tag.name,
            category: tag.category
          });
          tagMap.set(key, tagDoc);
          tagDocs.push(tagDoc);
        }

        const tagId = tagMap.get(key)._id;

        recipeTagDocs.push(new RecipeTag({
          recipe_id: recipeId,
          tag_id: tagId
        }));
      }

      // Create Recipe
      recipeDocs.push(new Recipe({
        _id: recipeId,
        user_id: fakeUserId,
        title: recipe.title,
        description: recipe.description,
        instruction: recipe.instruction,
        prep_time: recipe.prep_time,
        cook_time: recipe.cook_time,
        servings: recipe.servings,
        image_url: recipe.image_url,
        video_url: recipe.video_url
      }));
    }

    // Insert collections
    await Ingredient.insertMany(ingredientDocs);
    await Tag.insertMany(tagDocs);
    await Recipe.insertMany(recipeDocs);
    await RecipeIngredient.insertMany(recipeIngredientDocs);
    await RecipeTag.insertMany(recipeTagDocs);

    console.log("🌱 Seeding completed!");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
