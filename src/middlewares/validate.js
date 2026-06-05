'use strict';

const { body, validationResult } = require('express-validator');
const { error } = require('../utils/response');

function handleValidation(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const messages = result.array().map((e) => e.msg).join(', ');
    return error(res, messages, 400);
  }
  next();
}

const emailRule  = body('email').trim().isEmail().withMessage('Format email tidak valid').normalizeEmail();
const passRule   = body('password').isLength({ min: 8 }).withMessage('Password minimal 8 karakter');
const nameRule   = body('name').trim().notEmpty().withMessage('Nama wajib diisi').isLength({ max: 100 }).withMessage('Nama maksimal 100 karakter');
const shopIdOptRule = body('shopId')
  .optional({ nullable: true, checkFalsy: true })
  .isUUID().withMessage('shopId harus berformat UUID');

exports.login = [
  emailRule,
  body('password').notEmpty().withMessage('Password wajib diisi'),
  handleValidation,
];

exports.registerAdmin = [nameRule, emailRule, passRule, shopIdOptRule, handleValidation];
exports.registerUser  = [nameRule, emailRule, passRule, shopIdOptRule, handleValidation];

exports.forgotPassword = [emailRule, handleValidation];

exports.resetPassword = [
  body('token').notEmpty().withMessage('Token wajib diisi'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter'),
  handleValidation,
];

exports.changePassword = [
  body('currentPassword').notEmpty().withMessage('Password lama wajib diisi'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter'),
  handleValidation,
];
