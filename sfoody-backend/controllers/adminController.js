const User = require('../models/user');
const Recipe = require('../models/recipe');
const Report = require('../models/report');

exports.getAllUsers = async (req, res) => {
  const users = await User.find();
  res.json(users);
};

exports.updateUserStatus = async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(user);
};

exports.getAllPosts = async (req, res) => {
  const posts = await Recipe.find();
  res.json(posts);
};

exports.updatePostStatus = async (req, res) => {
  const post = await Recipe.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(post);
};

exports.getAllReports = async (req, res) => {
  const reports = await Report.find();
  res.json(reports);
};

exports.updateReportStatus = async (req, res) => {
  const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(report);
};
