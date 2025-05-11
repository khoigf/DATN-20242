const path = require('path');

const allowedImageTypes = ['.png', '.jpg', '.jpeg', '.gif'];
const allowedVideoTypes = ['.mp4', '.mov', '.avi'];

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.fieldname === 'image') {
    if (allowedImageTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận ảnh (png, jpg, jpeg, gif)'));
    }
  }

  if (file.fieldname === 'video') {
    if (allowedVideoTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận video (mp4, mov, avi)'));
    }
  }
}

module.exports = fileFilter;
