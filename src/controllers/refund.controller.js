'use strict';

const refundService = require('../services/refund.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await refundService.list(req.query, req.shopId, req.user.role);
    return paginated(res, data, meta, 'Daftar refund berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await refundService.detail(req.params.refundId, req.shopId, req.user.role);
    return success(res, data, 'Detail refund berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { invoice_no, reason, items } = req.body;
    if (!invoice_no || !items)
      return error(res, 'invoice_no dan items wajib diisi', 400);

    const data = await refundService.create(
      { invoice_no, reason, items },
      req.user.id,
      req.user.role,
      makeCtx(req),
    );
    return success(res, data, 'Refund berhasil diproses', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
