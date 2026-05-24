'use strict';

const categoryService = require('../services/category.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await categoryService.list(req.query);
    return paginated(res, data, meta, 'Daftar kategori berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'Nama kategori wajib diisi', 400);
    const data = await categoryService.create({ name }, makeCtx(req));
    return success(res, data, 'Kategori berhasil dibuat', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.update = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return error(res, 'Nama kategori wajib diisi', 400);
    const data = await categoryService.update(req.params.categoryId, { name }, makeCtx(req));
    return success(res, data, 'Kategori berhasil diperbarui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.remove = async (req, res) => {
  try {
    await categoryService.remove(req.params.categoryId, makeCtx(req));
    return success(res, null, 'Kategori berhasil dihapus');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
