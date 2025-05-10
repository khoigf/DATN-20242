const User = require('../models/userModel');
const Recipe = require('../models/recipeModel');
const Report = require('../models/reportModel');
const Comment = require('../models/commentModel');

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

  res.json({ posts, total });
};

exports.getPostById = async (req, res) => {
  const { id } = req.params;
  try {
    const post = await Recipe.findById(id).populate('user_id', 'username email')
    if (!post) return res.status(404).json({ msg: 'Post not found' });
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
  const { status } = req.body;
  try {
    const post = await Recipe.findByIdAndUpdate(id, { status }, { new: true })
      .populate('user_id', 'username email');
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  const { status } = req.body;
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