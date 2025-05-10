// controllers/searchController.js
const client = require('../utils/searchClient');
exports.searchRecipes = async (req, res) => {
  const index = client.index('recipes');
  const { q, filters } = req.query;

  const filterExpression = filters
    ? filters.split(',').map(t => `tags = "${t}"`).join(' AND ')
    : undefined;

  const result = await index.search(q || '', {
    filter: filterExpression,
  });

  res.json(result.hits);
};
