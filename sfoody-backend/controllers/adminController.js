const User = require('../models/userModel');
const Recipe = require('../models/recipeModel');
const Report = require('../models/reportModel');
const Comment = require('../models/commentModel');
const Notification = require('../models/notificationModel');
// const { io } = require('../server');
const { getIO, userSocketMap } = require('../socketManager');

// USER
exports.getAllUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const skip = (page - 1) * limit;

    const search = req.query.search || '';
    const regex = new RegExp(search, 'i'); // không phân biệt hoa thường

    const [users, total] = await Promise.all([
      User.find({ email: { $regex: regex } }).skip(skip).limit(limit).select('-password'),
      User.countDocuments({ email: { $regex: regex } })
    ]);

    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const user = await User.findByIdAndUpdate(id, { status }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// RECIPE (POST)
exports.getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const regex = new RegExp(search, 'i');

  const [posts, total] = await Promise.all([
    Recipe.find({ title: { $regex: regex } }).skip(skip).limit(limit).populate('user_id', 'username email'),
    Recipe.countDocuments({ title: { $regex: regex } })
  ]);
  posts.forEach(post => {
    post.image_url = post.image_url ? `${process.env.IMAGE_URL}${post.image_url}` : null;
    post.video_url = post.video_url ? `${process.env.IMAGE_URL}${post.video_url}` : null;
  })

  res.json({ posts, total });
};

exports.getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Recipe.findById(id).populate('user_id', 'username email')
    if (!post) return res.status(404).json({ msg: 'Post not found' });
    post.image_url = post.image_url ? `${process.env.IMAGE_URL}${post.image_url}` : null;
    post.video_url = post.video_url ? `${process.env.IMAGE_URL}${post.video_url}` : null;
    const comments = await Comment.find({ recipe_id: post._id })
      .populate('user_id', 'username')
      .sort({ created_at: -1 });

    const averageRating = comments.length
      ? (comments.reduce((sum, c) => sum + (c.rating || 0), 0) / comments.length).toFixed(1)
      : null;
    res.json({ ...post.toObject(), comments, averageRating });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePostStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;

  try {
    const post = await Recipe.findById(id).populate('user_id', 'username email');
    if (!post) {
      return res.status(404).json({ error: 'Không tìm thấy bài viết' });
    }

    // Cập nhật trạng thái
    post.status = status;
    await post.save();

    // Gửi thông báo nếu có lý do và trạng thái là ẩn (0)
    if (status === 0 && reason) {
      const notification = new Notification({
        user_id: post.user_id._id,
        type: 'post_hidden',
        message: `Bài viết "${post.title}" của bạn đã bị ẩn: ${reason}`,
        createdAt: new Date()
      });
      await notification.save();

      const io = getIO();
      const socketId = userSocketMap.get(String(post.user_id._id|| post.user_id));

      if (socketId) {
        io.to(socketId).emit('notification', {
          message: notification.message,
          createdAt: new Date(),
          _id: notification._id,
          isRead: false,
        });
      }
    }

    const updatedPost = await Recipe.findById(post._id).populate('user_id', 'username email');

    res.json(updatedPost);
  } catch (err) {
    console.error('Lỗi cập nhật trạng thái bài viết:', err);
    res.status(500).json({ error: 'Lỗi máy chủ' });
  }
};

// REPORT
exports.getAllReports = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  const search = req.query.search || '';
  const regex = new RegExp(search, 'i');

  try {
    const [reports, total] = await Promise.all([
      Report.find({ content: { $regex: regex } })
        .skip(skip)
        .limit(limit)
        .populate('user_id', 'username email')
        .populate('recipe_id', 'title'),
      Report.countDocuments({ content: { $regex: regex } }),
    ]);

    res.json({ reports, total });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy danh sách báo cáo: ' + err.message });
  }
};

// Lấy chi tiết một báo cáo theo ID
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('user_id', 'username email')
      .populate('recipe_id', 'title');
    if (!report) {
      return res.status(404).json({ msg: 'Không tìm thấy báo cáo' });
    }
    res.status(200).json(report);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy báo cáo: ' + err.message });
  }
};

// Cập nhật trạng thái báo cáo (0: chưa xử lý, 1: đã xóa, 2: không vi phạm)
exports.updateReportStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body;
  if (typeof status !== 'number' || ![0, 1, 2].includes(status)) {
    return res.status(400).json({ msg: 'Trạng thái không hợp lệ' });
  }

  try {
    const updated = await Report.findByIdAndUpdate(id, { status }, { new: true })
      .populate('user_id', 'username email')
      .populate('recipe_id', 'title');

    if (!updated) return res.status(404).json({ msg: 'Không tìm thấy báo cáo để cập nhật' });

    if (status === 1) {
      // Nếu báo cáo đã được xử lý (ẩn bài viết), cập nhật trạng thái bài viết
      await Recipe.findByIdAndUpdate(updated.recipe_id, { status: 0 });
      const notification = await Notification.create({
        user_id: updated.user_id,
        message: `Bài viết "${updated.recipe_id.title}" của bạn đã bị ẩn vì lý do: ${reason || 'vi phạm chính sách.'}`,
        type: 'report', // optional
        createdAt: new Date(),
      });
      const io = getIO();
      const socketId = userSocketMap.get(String(updated.user_id._id|| updated.user_id));

      if (socketId) {
        io.to(socketId).emit('notification', {
          message: notification.message,
          createdAt: new Date(),
          _id: notification._id,
          isRead: false,
        });
      }
    }

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi cập nhật báo cáo: ' + err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const [userCount, postCount, hiddenPosts, reportCount, pendingReports] = await Promise.all([
      User.countDocuments(),
      Recipe.countDocuments(),
      Recipe.countDocuments({ status: 0 }),
      Report.countDocuments(),
      Report.countDocuments({ status: 0 }),
    ]);

    res.json({
      users: userCount,
      posts: postCount,
      hiddenPosts,
      reports: reportCount,
      pendingReports,
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy thống kê: ' + err.message });
  }
};