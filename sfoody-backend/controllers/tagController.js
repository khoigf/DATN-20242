const Tag = require('../models/tagModel');

// Lấy toàn bộ tags (nếu cần)
exports.getAllTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    res.status(200).json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Lấy tags và nhóm theo category
exports.getGroupedTags = async (req, res) => {
  try {
    const tags = await Tag.find();
    const grouped = {};

    tags.forEach(tag => {
      if (!grouped[tag.category]) grouped[tag.category] = [];
      grouped[tag.category].push(tag);
    });

    res.status(200).json(grouped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
