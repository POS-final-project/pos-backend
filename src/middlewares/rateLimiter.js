'use strict';

const rateLimit = require('express-rate-limit');

const { error } = require('../utils/response');

function makeHandler(message) {
  return (req, res) => error(res, message, 429);
}

exports.loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Terlalu banyak percobaan login. Coba lagi dalam 15 menit.'),
});

exports.forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Terlalu banyak permintaan reset password. Coba lagi dalam 15 menit.'),
});

exports.resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Terlalu banyak percobaan reset password. Coba lagi dalam 15 menit.'),
});
