const client = require('../utils/searchClient');

exports.searchRecipes = async (req, res) => {
  const {
    q = '',
    tags,
    ingredients,
    sort,
    limit = 20,
    offset = 0,
  } = req.query;

  try {
    const index = client.index('recipes');

    const filterConditions = [];

    // ✅ Lọc theo tags nếu có
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filterConditions.push(...tagArray.map(tag => `tags = "${tag}"`));
    }

    // ✅ Lọc theo ingredients nếu có
    if (ingredients) {
      const ingArray = Array.isArray(ingredients) ? ingredients : [ingredients];
      filterConditions.push(...ingArray.map(ing => `ingredients.name = "${ing}"`));
    }

    // ✅ Tạo object search parameters
    const searchParams = {
      q: q,
      filter: filterConditions,
      sort: sort ? [sort] : undefined,
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    // 🔍 Thực hiện tìm kiếm trên Meilisearch
    const searchResults = await index.search(q, searchParams);

    const filteredResults = searchResults.hits.filter(item => item.status === 1);
    return res.status(200).json(filteredResults);
  } catch (err) {
    console.error('❌ Lỗi khi tìm kiếm:', err.message);
    return res.status(500).json({ error: 'Search failed' });
  }
};
