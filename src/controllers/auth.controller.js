'use strict';

const authService = require('../services/auth.service');
const { success, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email dan password wajib diisi', 400);
    const data = await authService.login({ email, password }, makeCtx(req));
    return success(res, data, 'Login berhasil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return error(res, 'refreshToken wajib diisi', 400);
    const data = await authService.refresh(refreshToken);
    return success(res, data, 'Token diperbarui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.logout = (req, res) => {
  return success(res, null, 'Logout berhasil');
};

exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, shopId } = req.body;
    if (!name || !email || !password) return error(res, 'name, email, password wajib diisi', 400);
    const data = await authService.registerAdmin({ name, email, password, shopId: shopId || null }, makeCtx(req));
    return success(res, data, 'Admin berhasil didaftarkan', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { name, email, password, shopId } = req.body;
    if (!name || !email || !password) return error(res, 'name, email, password wajib diisi', 400);
    const data = await authService.registerUser({ name, email, password, shopId: shopId || null }, req.user, makeCtx(req));
    return success(res, data, 'User berhasil didaftarkan', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email wajib diisi', 400);
    await authService.forgotPassword(email);
    return success(res, null, 'Jika email terdaftar, link reset password telah dikirim');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return error(res, 'token dan newPassword wajib diisi', 400);
    await authService.resetPassword(token, newPassword, makeCtx(req));
    return success(res, null, 'Password berhasil direset');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return error(res, 'currentPassword dan newPassword wajib diisi', 400);
    await authService.changePassword(req.user.id, { currentPassword, newPassword }, makeCtx(req));
    return success(res, null, 'Password berhasil diubah');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
