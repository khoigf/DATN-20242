exports.searchRecipes = async (req, res) => {
    const { query, tags } = req.body; // query: từ khóa, tags: mảng tag name
  
    const client = require('../utils/searchClient');
    const index = client.index('recipes');
  
    const filterTags = tags?.map(tag => `tag_ids = "${tag}"`).join(' AND ');
  
    try {
      const result = await index.search(query || '', {
        filter: filterTags || undefined,
      });
      res.json(result.hits);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  