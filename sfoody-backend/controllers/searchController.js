const client = require('../utils/searchClient');

exports.searchRecipes = async (req, res) => {
  const { query, tags, ingredients, sort, limit = 20, offset = 0 } = req.query;

  try {
    const index = client.index('recipes');

    const filterConditions = [];

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filterConditions.push(...tagArray.map(tag => `tags = "${tag}"`));
    }

    if (ingredients) {
      const ingArray = Array.isArray(ingredients) ? ingredients : [ingredients];
      filterConditions.push(...ingArray.map(ing => `ingredients.name = "${ing}"`));
    }

    const searchParams = {
      q: query || '',
      filter: filterConditions.length ? filterConditions : undefined,
      sort: sort ? [sort] : undefined, // e.g., sort = "created_at:desc"
      limit: parseInt(limit),
      offset: parseInt(offset),
    };

    const searchResults = await index.search(query || '', searchParams);
    res.json(searchResults.hits);
  } catch (err) {
    console.error('Search error:', err.message);
    res.status(500).json({ error: 'Search failed' });
  }
};
