'use strict';

const bcrypt = require('bcryptjs');
const { User, UserShop, Shop } = require('../models');
const { signAccess, signRefresh, signReset, verifyRefresh, verifyAccess } = require('../utils/jwt');
const emailService = require('./email.service');
const auditLogService = require('./auditLog.service');

const SAFE_USER_ATTRS = ['id', 'name', 'email', 'role', 'phone', 'image_url', 'is_active', 'created_at'];

exports.login = async ({ email, password }, ctx = {}) => {
  const user = await User.findOne({ where: { email, is_active: true } });
  if (!user) throw { status: 401, message: 'Email atau password salah' };

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw { status: 401, message: 'Email atau password salah' };

  const payload = { id: user.id, role: user.role };
  const result = {
    accessToken: signAccess(payload),
    refreshToken: signRefresh({ ...payload, type: 'refresh' }),
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };

  await auditLogService.log({
    userId: user.id,
    shopId: null,
    entityType: 'user',
    entityId: user.id,
    action: 'login',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};

exports.refresh = async (refreshToken) => {
  let payload;
  try {
    payload = verifyRefresh(refreshToken);
  } catch {
    throw { status: 401, message: 'Refresh token invalid atau expired' };
  }
  if (payload.type !== 'refresh') throw { status: 401, message: 'Token bukan refresh token' };

  const user = await User.findOne({ where: { id: payload.id, is_active: true } });
  if (!user) throw { status: 401, message: 'User tidak ditemukan atau tidak aktif' };

  return { accessToken: signAccess({ id: user.id, role: user.role }) };
};

exports.registerAdmin = async ({ name, email, password, shopId }, ctx = {}) => {
  const existing = await User.findOne({ where: { email } });
  if (existing) throw { status: 409, message: 'Email sudah digunakan' };

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: 'admin' });
  await UserShop.create({ user_id: user.id, shop_id: shopId });

  await auditLogService.log({
    userId: ctx.userId,
    shopId,
    entityType: 'user',
    entityId: user.id,
    action: 'register_admin',
    newValues: { id: user.id, name: user.name, email: user.email, role: user.role },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

exports.registerUser = async ({ name, email, password, shopId }, requester, ctx = {}) => {
  if (requester.role === 'admin') {
    const assignment = await UserShop.findOne({ where: { user_id: requester.id, shop_id: shopId } });
    if (!assignment) throw { status: 403, message: 'Anda tidak bisa mendaftarkan user ke toko lain' };
  }

  const existing = await User.findOne({ where: { email } });
  if (existing) throw { status: 409, message: 'Email sudah digunakan' };

  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role: 'user' });
  await UserShop.create({ user_id: user.id, shop_id: shopId });

  await auditLogService.log({
    userId: requester.id,
    shopId,
    entityType: 'user',
    entityId: user.id,
    action: 'register_user',
    newValues: { id: user.id, name: user.name, email: user.email, role: user.role },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { id: user.id, name: user.name, email: user.email, role: user.role };
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ where: { email, is_active: true } });
  if (!user) return; // silent fail for security

  const token = signReset({ id: user.id, purpose: 'reset' });
  const link = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password?token=${token}`;
  await emailService.sendResetPassword(email, link);
};

exports.resetPassword = async (token, newPassword, ctx = {}) => {
  let payload;
  try {
    payload = verifyAccess(token);
  } catch {
    throw { status: 400, message: 'Token invalid atau expired' };
  }
  if (payload.purpose !== 'reset') throw { status: 400, message: 'Token tidak valid untuk reset password' };

  const hashed = await bcrypt.hash(newPassword, 10);
  const [updated] = await User.update({ password: hashed }, { where: { id: payload.id } });
  if (!updated) throw { status: 404, message: 'User tidak ditemukan' };

  await auditLogService.log({
    userId: payload.id,
    shopId: null,
    entityType: 'user',
    entityId: payload.id,
    action: 'reset_password',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

exports.changePassword = async (userId, { currentPassword, newPassword }, ctx = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: 'User tidak ditemukan' };

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw { status: 400, message: 'Password lama tidak sesuai' };

  const hashed = await bcrypt.hash(newPassword, 10);
  await user.update({ password: hashed });

  await auditLogService.log({
    userId,
    shopId: null,
    entityType: 'user',
    entityId: userId,
    action: 'change_password',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};
