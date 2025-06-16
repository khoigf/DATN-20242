// utils/searchClient.js
const { MeiliSearch } = require('meilisearch');
require('dotenv').config();

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://127.0.0.1:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || 'masterKey',
});

// ⚙️ Thiết lập searchableAttributes cho index 'recipes'
async function setupIndex() {
  try {
    const index = client.index('recipes');
    await index.updateSearchableAttributes([
      'title',
      'description',
      'ingredients.name',
      'tags'
    ]);
    console.log('✅ searchableAttributes đã được cập nhật.');
  } catch (err) {
    console.error('❌ Lỗi khi cập nhật searchableAttributes:', err.message);
  }
}

// Gọi hàm setup khi chạy file
setupIndex();

module.exports = client;
