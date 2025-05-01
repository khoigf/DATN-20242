const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  }
});

exports.sendVerificationEmail = (to, token) => {
  const link = `${process.env.CLIENT_URL}/verify?token=${token}`;
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: 'Xác minh email tài khoản S-Foody',
    html: `<p>Nhấn vào link để xác minh: <a href="${link}">${link}</a></p>`
  });
};

exports.sendResetEmail = (to, token) => {
  const link = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  return transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: 'Khôi phục mật khẩu S-Foody',
    html: `<p>Nhấn để đặt lại mật khẩu: <a href="${link}">${link}</a></p>`
  });
};
