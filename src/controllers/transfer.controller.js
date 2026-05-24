'use strict';

const transferService = require('../services/transfer.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.create = async (req, res) => {
  try {
    const { from_shop_id, to_shop_id, note, items } = req.body;
    if (!from_shop_id || !to_shop_id || !items) return error(res, 'from_shop_id, to_shop_id, items wajib diisi', 400);
    const data = await transferService.create(
      { from_shop_id, to_shop_id, note, items },
      req.user.id,
      req.user.role,
      makeCtx(req),
    );
    return success(res, data, 'Transfer berhasil dibuat', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.listOutgoing = async (req, res) => {
  try {
    const { data, meta } = await transferService.listOutgoing(req.query, req.shopId, req.user.id, req.user.role);
    return paginated(res, data, meta, 'Daftar transfer keluar berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.listIncoming = async (req, res) => {
  try {
    const { data, meta } = await transferService.listIncoming(req.query, req.shopId, req.user.id, req.user.role);
    return paginated(res, data, meta, 'Daftar transfer masuk berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await transferService.detail(req.params.transferId, req.user.id, req.user.role);
    return success(res, data, 'Detail transfer berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.items = async (req, res) => {
  try {
    const data = await transferService.items(req.params.transferId, req.user.id, req.user.role);
    return success(res, data, 'Item transfer berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.approve = async (req, res) => {
  try {
    const data = await transferService.approve(req.params.transferId, req.user.id, req.user.role, makeCtx(req));
    return success(res, data, 'Transfer berhasil disetujui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.reject = async (req, res) => {
  try {
    const data = await transferService.reject(req.params.transferId, req.user.id, req.user.role, makeCtx(req));
    return success(res, data, 'Transfer berhasil ditolak');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.cancel = async (req, res) => {
  try {
    const data = await transferService.cancel(req.params.transferId, req.user.id, req.user.role, makeCtx(req));
    return success(res, data, 'Transfer berhasil dibatalkan');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
