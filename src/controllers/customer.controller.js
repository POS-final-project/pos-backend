'use strict';

const customerService = require('../services/customer.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await customerService.list(req.query);
    return paginated(res, data, meta, 'Daftar customer berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, phone, email, address } = req.body;
    if (!name) return error(res, 'Nama customer wajib diisi', 400);
    const data = await customerService.create({ name, phone, email, address }, makeCtx(req));
    return success(res, data, 'Customer berhasil dibuat', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await customerService.detail(req.params.customerId);
    return success(res, data, 'Detail customer berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await customerService.update(req.params.customerId, req.body, makeCtx(req));
    return success(res, data, 'Customer berhasil diperbarui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.remove = async (req, res) => {
  try {
    await customerService.remove(req.params.customerId, makeCtx(req));
    return success(res, null, 'Customer berhasil dihapus');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.transactions = async (req, res) => {
  try {
    const { data, meta } = await customerService.transactions(req.params.customerId, req.query);
    return paginated(res, data, meta, 'Riwayat transaksi customer berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
