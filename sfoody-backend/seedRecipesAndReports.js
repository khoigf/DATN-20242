const mongoose = require('mongoose');
require('dotenv').config();
const Recipe = require('./models/recipeModel');
const Report = require('./models/reportModel');
const User = require('./models/userModel');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function seed() {
  try {
    const users = await User.find().limit(3); // Lấy 3 user bất kỳ
    if (users.length === 0) throw new Error('No users found');

    // Xóa dữ liệu cũ (nếu muốn)
    await Recipe.deleteMany({});
    await Report.deleteMany({});

    // Tạo 10 công thức
    const sampleRecipes = [];
    for (let i = 0; i < 10; i++) {
      const recipe = new Recipe({
        user_id: users[i % users.length]._id,
        title: `Công thức món ăn ${i + 1}`,
        description: `Mô tả chi tiết cho món ăn ${i + 1}`,
        instruction: `Các bước nấu món ăn ${i + 1}`,
        prep_time: 10 + i,
        cook_time: 15 + i,
        servings: 2 + (i % 3),
        image_url: `https://example.com/image${i + 1}.jpg`,
        video_url: `https://youtube.com/video${i + 1}`,
        status: i % 2 === 0 ? 1 : 0,
      });
      await recipe.save();
      sampleRecipes.push(recipe);
    }

    // Tạo 10 báo cáo
    for (let i = 0; i < 10; i++) {
      const report = new Report({
        user_id: users[(i + 1) % users.length]._id,
        recipe_id: sampleRecipes[i]._id,
        content: `Báo cáo vi phạm cho công thức ${sampleRecipes[i].title}`,
        status: i % 3 === 0 ? 1 : 0,
      });
      await report.save();
    }

    console.log('Seed thành công!');
  } catch (err) {
    console.error('Lỗi seed:', err);
  } finally {
    mongoose.disconnect();
  }
}

seed();
