const mongoose = require('mongoose');
const Tag = require('./models/tagModel'); // Đảm bảo đường dẫn đúng với file Tag model
const Ingredient = require('./models/ingredientModel'); // Đảm bảo đường dẫn đúng với file Ingredient model

const MONGODB_URI = 'mongodb+srv://root:8KPVZpgNIqnIq2gP@cluster0.ipujnzr.mongodb.net/Sfoody'; // Thay đổi nếu bạn dùng URI khác

const tags = [
  // ingredient
  { name: 'Thịt heo', category: 'ingredient' },
  { name: 'Thịt bò', category: 'ingredient' },
  { name: 'Thịt gà', category: 'ingredient' },
  { name: 'Cá', category: 'ingredient' },
  { name: 'Hải sản', category: 'ingredient' },
  { name: 'Trứng', category: 'ingredient' },
  { name: 'Rau xanh', category: 'ingredient' },

  // cooking_style
  { name: 'Chiên', category: 'cooking_style' },
  { name: 'Xào', category: 'cooking_style' },
  { name: 'Luộc', category: 'cooking_style' },
  { name: 'Hấp', category: 'cooking_style' },
  { name: 'Kho', category: 'cooking_style' },
  { name: 'Nướng', category: 'cooking_style' },
  { name: 'Om', category: 'cooking_style' },
  { name: 'Hầm', category: 'cooking_style' },

  // nutrition
  { name: 'Giàu đạm', category: 'nutrition' },
  { name: 'Giàu chất xơ', category: 'nutrition' },
  { name: 'Ít béo', category: 'nutrition' },
  { name: 'Ăn chay', category: 'nutrition' },
  { name: 'Keto', category: 'nutrition' },
    { name: 'Low carb', category: 'nutrition' },
    { name: 'Không gluten', category: 'nutrition' },
    { name: 'Ít đường', category: 'nutrition' },
    { name: 'Ít muối', category: 'nutrition' },
    { name: 'Ít calo', category: 'nutrition' },
    { name: 'Giàu vitamin', category: 'nutrition' },
    { name: 'Giàu khoáng chất', category: 'nutrition' },
    
  // region
  { name: 'Huế', category: 'region' },
  { name: 'Hà Nội', category: 'region' },
  { name: 'Sài Gòn', category: 'region' },

  // occasion
  { name: 'Tết', category: 'occasion' },
  { name: 'Trung thu', category: 'occasion' },
  { name: 'Sinh nhật', category: 'occasion' },
  { name: 'Cưới hỏi', category: 'occasion' },
  { name: 'Ăn trưa', category: 'occasion' },
  { name: 'Ăn tối', category: 'occasion' },
    { name: 'Tiệc tùng', category: 'occasion' },
    { name: 'Đám giỗ', category: 'occasion' },
    { name: 'Dã ngoại', category: 'occasion' },
    { name: 'Du lịch', category: 'occasion' },

  // cooking_time
  { name: 'Dưới 15 phút', category: 'cooking_time' },
  { name: '15–30 phút', category: 'cooking_time' },
  { name: '30–60 phút', category: 'cooking_time' },
  { name: 'Trên 1 tiếng', category: 'cooking_time' },

  // other
  { name: 'Dễ làm', category: 'other' },
  { name: 'Cho người mới bắt đầu', category: 'other' },
  { name: 'Cho bé ăn dặm', category: 'other' },
    { name: 'Thích hợp cho người ăn kiêng', category: 'other' },
    { name: 'Thích hợp cho người ăn chay', category: 'other' },
];

const ingredients = [
  // meat
  { name: 'Thịt heo', category: 'meat' },
  { name: 'Thịt gà', category: 'meat' },
  { name: 'Cá hồi', category: 'meat' },
  { name: 'Tôm', category: 'meat' },
  { name: 'Cua', category: 'meat' },
  { name: 'Trứng gà', category: 'meat' },
    { name: 'Thịt vịt', category: 'meat' },
    { name: 'Thịt cừu', category: 'meat' },
    { name: 'Thịt ngan', category: 'meat' },
    { name: 'Thịt ngỗng', category: 'meat' },
    { name: 'Thịt dê', category: 'meat' },
    { name: 'Thịt ba chỉ', category: 'meat' },

  // vegetable
  { name: 'Rau muống', category: 'vegetable' },
  { name: 'Rau cải', category: 'vegetable' },
  { name: 'Cà rốt', category: 'vegetable' },
  { name: 'Khoai tây', category: 'vegetable' },
  { name: 'Giá đỗ', category: 'vegetable' },
  { name: 'Nấm rơm', category: 'vegetable' },
  { name: 'Khổ qua', category: 'vegetable' },
    { name: 'Bông cải xanh', category: 'vegetable' },
    { name: 'Ớt chuông', category: 'vegetable' },
    { name: 'Ngò rí', category: 'vegetable' },
    { name: 'Húng quế', category: 'vegetable' },
    { name: 'Tía tô', category: 'vegetable' },
    { name: 'Rau diếp', category: 'vegetable' },

  // spice
  { name: 'Đường', category: 'spice' },
  { name: 'Dầu ăn', category: 'spice' },
  { name: 'Ớt', category: 'spice' },
    { name: 'Hành tím', category: 'spice' },
    { name: 'Sả', category: 'spice' },
    { name: 'Mắm tôm', category: 'spice' },
    { name: 'Bột ngọt', category: 'spice' },
    { name: 'Nước tương', category: 'spice' },

  // other
  { name: 'Gạo', category: 'other' },
  { name: 'Phở', category: 'other' },
    { name: 'Miến', category: 'other' },
    { name: 'Bánh mì', category: 'other' },
    { name: 'Bột năng', category: 'other' },
    { name: 'Bột ngô', category: 'other' },
    { name: 'Nước dừa', category: 'other' },
    { name: 'Sữa tươi', category: 'other' },
    { name: 'Cơm', category: 'other' },
  { name: 'Mì gói', category: 'other' },
  { name: 'Bột mì', category: 'other' },
  { name: 'Phô mai', category: 'other' },
  { name: 'Sữa đặc', category: 'other' },
  { name: 'Mật ong', category: 'other' },
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🌱 Connected to MongoDB');

    await Tag.insertMany(tags);
    await Ingredient.insertMany(ingredients);

    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
