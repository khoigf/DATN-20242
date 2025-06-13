const mongoose = require('mongoose');
const Tag = require('./models/tagModel'); // Đảm bảo đường dẫn đúng với file Tag model
const recpieTag = require('./models/recipeTagModel'); // Đảm bảo đường dẫn đúng với file RecipeTag model

const MONGODB_URI = 'mongodb+srv://root:8KPVZpgNIqnIq2gP@cluster0.ipujnzr.mongodb.net/Sfoody'; // Thay đổi nếu bạn dùng URI khác

const tags = [
  // ingredient
  { "name": "Gà", "category": "ingredient" },
  { "name": "Bò", "category": "ingredient" },
  { "name": "Lợn", "category": "ingredient" },
  { "name": "Cá", "category": "ingredient" },
  { "name": "Hải sản", "category": "ingredient" },
  { "name": "Thịt rừng", "category": "ingredient" },
  { "name": "Rau xanh", "category": "ingredient" },
  { "name": "Củ", "category": "ingredient" },
  { "name": "Trái cây", "category": "ingredient" },
  { "name": "Gia vị", "category": "ingredient" },
  { "name": "Các loại sốt", "category": "ingredient" },
  { "name": "Dầu ăn", "category": "ingredient" },

  // cooking_style
  { "name": "Chiên", "category": "cooking_style" },
  { "name": "Xào", "category": "cooking_style" },
  { "name": "Hấp", "category": "cooking_style" },
  { "name": "Nướng", "category": "cooking_style" },
  { "name": "Luộc", "category": "cooking_style" },
  { "name": "Kho", "category": "cooking_style" },
  { "name": "Lẩu", "category": "cooking_style" },
  { "name": "Nướng không dầu", "category": "cooking_style" },
  { "name": "Nồi chiên không dầu", "category": "cooking_style" },
  { "name": "Lò vi sóng", "category": "cooking_style" },

  // nutrition
  { "name": "Ăn chay", "category": "nutrition" },
  { "name": "Thuần chay", "category": "nutrition" },
  { "name": "Ăn kiêng", "category": "nutrition" },
  { "name": "Ít calo", "category": "nutrition" },
  { "name": "Nhiều protein", "category": "nutrition" },
  { "name": "Giàu chất xơ", "category": "nutrition" },
  { "name": "Giàu vitamin", "category": "nutrition" },
  { "name": "Giàu khoáng chất", "category": "nutrition" },
  { "name": "Ít tinh bột", "category": "nutrition" },
  { "name": "Ít chất béo", "category": "nutrition" },
  { "name": "Giàu đạm", "category": "nutrition" },
  { "name": "Giàu tinh bột", "category": "nutrition" },
  { "name": "Giàu chất béo tốt", "category": "nutrition" },
  { "name": "Không đường", "category": "nutrition" },

  // region
  { "name": "Việt Nam", "category": "region" },
  { "name": "Nhật Bản", "category": "region" },
  { "name": "Hàn Quốc", "category": "region" },
  { "name": "Thái Lan", "category": "region" },
  { "name": "Trung Quốc", "category": "region" },
  { "name": "Ấn Độ", "category": "region" },
  { "name": "Pháp", "category": "region" },
  { "name": "Ý", "category": "region" },
  { "name": "Tây Ban Nha", "category": "region" },

  // occasion
  { "name": "Món ăn Tết", "category": "occasion" },
  { "name": "Món ăn Giáng sinh", "category": "occasion" },
  { "name": "Món ăn Trung thu", "category": "occasion" },
  { "name": "Món sáng", "category": "occasion" },
  { "name": "Món trưa", "category": "occasion" },
  { "name": "Món tối", "category": "occasion" },
  { "name": "Món ăn nhẹ", "category": "occasion" },
  { "name": "Món ăn cho bé", "category": "occasion" },
  { "name": "Món ăn cho gia đình", "category": "occasion" },
  { "name": "Trước khi tập", "category": "occasion" },
  { "name": "Sau khi tập", "category": "occasion" },

  // cooking_time
  { "name": "Dưới 15 phút", "category": "cooking_time" },
  { "name": "15 - 30 phút", "category": "cooking_time" },
  { "name": "30 - 60 phút", "category": "cooking_time" },
  { "name": "Hơn 60 phút", "category": "cooking_time" },

  // other (health-related & goal-based)
  { "name": "Giảm cân", "category": "other" },
  { "name": "Tăng cân", "category": "other" },
  { "name": "Tăng cơ", "category": "other" },
  { "name": "Giải độc", "category": "other" },
  { "name": "Tốt cho tim mạch", "category": "other" },
  { "name": "Tốt cho người tiểu đường", "category": "other" },
  { "name": "Giúp giảm cân", "category": "other" },
  { "name": "Tốt cho hệ tiêu hóa", "category": "other" },
  { "name": "Tăng cường miễn dịch", "category": "other" },
  { "name": "Phụ nữ mang thai", "category": "other" },
  { "name": "Phụ nữ sau sinh", "category": "other" },
  { "name": "Người cao tuổi", "category": "other" },
  { "name": "Không gluten", "category": "other" },
  { "name": "Không đậu phộng", "category": "other" }
];

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🌱 Connected to MongoDB');
    await Tag.deleteMany({}); // Xoá tất cả các tag hiện có
    await recpieTag.deleteMany({}); // Xoá tất cả các recipe tag hiện có
    console.log('🗑️ Cleared existing tags');

    await Tag.insertMany(tags);

    console.log('✅ Seed completed successfully!');
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedDatabase();
