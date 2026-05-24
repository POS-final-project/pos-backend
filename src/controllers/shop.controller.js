'use strict';

const shopService = require('../services/shop.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await shopService.list(req.query, req.user.id, req.user.role);
    return paginated(res, data, meta, 'Daftar toko berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, address, phone } = req.body;
    if (!name) return error(res, 'Nama toko wajib diisi', 400);
    const data = await shopService.create({ name, address, phone }, makeCtx(req));
    return success(res, data, 'Toko berhasil dibuat', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await shopService.detail(req.params.shopId, req.user.id, req.user.role);
    return success(res, data, 'Detail toko berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await shopService.update(req.params.shopId, req.user.id, req.user.role, req.body, makeCtx(req));
    return success(res, data, 'Toko berhasil diperbarui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.remove = async (req, res) => {
  try {
    await shopService.remove(req.params.shopId, makeCtx(req));
    return success(res, null, 'Toko berhasil dihapus');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.assignStaff = async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return error(res, 'userId wajib diisi', 400);
    await shopService.assignStaff(req.params.shopId, req.user.id, req.user.role, { userId }, makeCtx(req));
    return success(res, null, 'Staff berhasil ditugaskan ke toko', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.removeStaff = async (req, res) => {
  try {
    await shopService.removeStaff(req.params.shopId, req.user.id, req.user.role, req.params.userId, makeCtx(req));
    return success(res, null, 'Staff berhasil dihapus dari toko');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.listStaff = async (req, res) => {
  try {
    const data = await shopService.listStaff(req.params.shopId, req.user.id, req.user.role);
    return success(res, data, 'Daftar staff berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
