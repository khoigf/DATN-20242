const Comment = require('../models/commentModel');
const Recipe = require('../models/recipeModel');
const Notification = require('../models/notificationModel');
const client = require('../utils/searchClient');
const index = client.index('recipes');
const { getIO, userSocketMap } = require('../socketManager');

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
    const populatedComment = await newComment.populate('user_id', 'username');
    const recipe = await Recipe.findById(recipe_id);

    const notification = new Notification({
      user_id: recipe.user_id,
      type: 'comment',
      message: `${populatedComment.user_id.username} đã bình luận về công thức ${recipe.title}`,
      createdAt: new Date()
    });

    await notification.save();
    const io = getIO();
    const socketId = userSocketMap.get(String(recipe.user_id));
    if (socketId) {
        io.to(socketId).emit('notification', {
          message: notification.message,
          createdAt: new Date(),
          _id: notification._id,
          isRead: false,
        });
      }
    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getCommentsByRecipe = async (req, res) => {
    try {
      const comments = await Comment.find({ recipe_id: req.params.id }).populate('user_id', 'username');
      res.status(200).json(comments);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
  