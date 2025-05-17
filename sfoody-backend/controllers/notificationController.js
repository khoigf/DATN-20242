const Notification = require('../models/notificationModel');

exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ user_id: userId }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lấy thông báo: ' + err.message });
  }
};

exports.markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return res.status(404).json({ msg: 'Không tìm thấy thông báo' });
    }
    notification.isRead = true;
    await notification.save();
    res.status(200).json(notification);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi đánh dấu thông báo là đã đọc: ' + err.message });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification) {
      return res.status(404).json({ msg: 'Không tìm thấy thông báo' });
    }
    res.status(200).json({ msg: 'Đã xóa thông báo' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi xóa thông báo: ' + err.message });
  }
}