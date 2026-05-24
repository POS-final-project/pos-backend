'use strict';

const transactionService = require('../services/transaction.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await transactionService.list(req.query, req.shopId, req.user.role);
    return paginated(res, data, meta, 'Daftar transaksi berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await transactionService.detail(req.params.transactionId, req.shopId, req.user.role);
    return success(res, data, 'Detail transaksi berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { shop_id, customer_id, payment_method, note, items } = req.body;
    if (!shop_id || !payment_method || !items)
      return error(res, 'shop_id, payment_method, dan items wajib diisi', 400);

    const data = await transactionService.create(
      { shop_id, customer_id, payment_method, note, items },
      req.user.id,
      req.user.role,
      makeCtx(req),
    );
    return success(res, data, 'Transaksi berhasil dibuat', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.receipt = async (req, res) => {
  try {
    const data = await transactionService.getReceipt(req.params.transactionId, req.shopId, req.user.role);
    return success(res, data, 'Receipt berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.cancel = async (req, res) => {
  try {
    const data = await transactionService.cancel(
      req.params.transactionId,
      req.shopId,
      req.user.id,
      req.user.role,
      makeCtx(req),
    );
    return success(res, data, 'Transaksi berhasil dibatalkan');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
