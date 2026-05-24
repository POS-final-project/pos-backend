'use strict';

const userService = require('../services/user.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await userService.list(req.query);
    return paginated(res, data, meta, 'Daftar user berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await userService.detail(req.params.userId);
    return success(res, data, 'Detail user berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, role, is_active } = req.body;
    const data = await userService.update(req.params.userId, { name, phone, role, is_active }, makeCtx(req));
    return success(res, data, 'User berhasil diperbarui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
