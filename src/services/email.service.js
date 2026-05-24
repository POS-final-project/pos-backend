'use strict';

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendResetPassword = async (to, resetLink) => {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || '"POS System" <no-reply@pos.com>',
    to,
    subject: 'Reset Password - POS System',
    html: `
      <p>Anda menerima permintaan reset password.</p>
      <p>Klik link berikut untuk melanjutkan (berlaku 15 menit):</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>Abaikan email ini jika Anda tidak merasa melakukan permintaan ini.</p>
    `,
  });
};
