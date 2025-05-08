const Comment = require('../models/commentModel');

exports.createComment = async (req, res) => {
  try {
    const { recipe_id, content, rating } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!recipe_id || !content) {
      return res.status(400).json({ message: 'Thiếu thông tin' });
    }

    const newComment = await Comment.create({
      user_id: req.user.id,
      recipe_id,
      content,
      rating: rating ? Number(rating) : undefined
    });

    // Populate user để trả về ngay tên người bình luận
    const populatedComment = await newComment.populate('user_id', 'name');

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getCommentsByRecipe = async (req, res) => {
    try {
      const comments = await Comment.find({ recipe_id: req.params.id }).populate('user_id', 'name');
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  