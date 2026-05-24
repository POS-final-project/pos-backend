'use strict';

const inventoryService = require('../services/inventory.service');
const { success, paginated, error } = require('../utils/response');

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
});

exports.list = async (req, res) => {
  try {
    const { data, meta } = await inventoryService.list(req.query, req.shopId);
    return paginated(res, data, meta, 'Daftar inventory berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.byProduct = async (req, res) => {
  try {
    const { data, meta } = await inventoryService.byProduct(req.params.productId, req.query, req.shopId);
    return paginated(res, data, meta, 'Inventory produk berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.restock = async (req, res) => {
  try {
    const { shop_id, product_variant_id, qty, cost_price, note } = req.body;
    if (!shop_id || !product_variant_id || !qty) return error(res, 'shop_id, product_variant_id, qty wajib diisi', 400);
    if (qty <= 0) return error(res, 'qty harus lebih dari 0', 400);

    if (req.user.role !== 'superAdmin') {
      const { UserShop } = require('../models');
      const assignment = await UserShop.findOne({ where: { user_id: req.user.id, shop_id } });
      if (!assignment) return error(res, 'Akses ke toko ini tidak diizinkan', 403);
    }

    const data = await inventoryService.restock(
      { shop_id, product_variant_id, qty, cost_price, note },
      req.user.id,
      makeCtx(req),
    );
    return success(res, data, 'Restock berhasil', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.adjustOut = async (req, res) => {
  try {
    const { shop_id, product_variant_id, qty, note } = req.body;
    if (!shop_id || !product_variant_id || !qty) return error(res, 'shop_id, product_variant_id, qty wajib diisi', 400);
    if (qty <= 0) return error(res, 'qty harus lebih dari 0', 400);

    if (req.user.role !== 'superAdmin') {
      const { UserShop } = require('../models');
      const assignment = await UserShop.findOne({ where: { user_id: req.user.id, shop_id } });
      if (!assignment) return error(res, 'Akses ke toko ini tidak diizinkan', 403);
    }

    const data = await inventoryService.adjustOut(
      { shop_id, product_variant_id, qty, note },
      req.user.id,
      makeCtx(req),
    );
    return success(res, data, 'Adjustment stok keluar berhasil', 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.setThreshold = async (req, res) => {
  try {
    const { low_stock_threshold } = req.body;
    if (low_stock_threshold === undefined || low_stock_threshold < 0) {
      return error(res, 'low_stock_threshold wajib diisi dan tidak boleh negatif', 400);
    }
    const data = await inventoryService.setThreshold(
      req.params.inventoryId,
      { low_stock_threshold },
      req.user.id,
      req.user.role,
      makeCtx(req),
    );
    return success(res, data, 'Threshold berhasil diperbarui');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.movementHistory = async (req, res) => {
  try {
    const { data, meta } = await inventoryService.movementHistory(req.query, req.shopId);
    return paginated(res, data, meta, 'Riwayat pergerakan stok berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
