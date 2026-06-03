'use strict';

const { Op } = require('sequelize');
const { Transfer, TransferItem, Inventory, StockMovement, ProductVariant, Product, Shop, User, UserShop } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService = require('./auditLog.service');
const notifService    = require('./notification.service');

const TRANSFER_INCLUDE = [
  { model: Shop, as: 'fromShop', attributes: ['id', 'name'] },
  { model: Shop, as: 'toShop', attributes: ['id', 'name'] },
  { model: User, as: 'requester', attributes: ['id', 'name'] },
  { model: User, as: 'confirmer', attributes: ['id', 'name'] },
];

// ─── create ───────────────────────────────────────────────────────────────────

exports.create = async ({ from_shop_id, to_shop_id, note, items }, userId, userRole, ctx = {}) => {
  if (from_shop_id === to_shop_id) throw { status: 400, message: 'Toko asal dan tujuan tidak boleh sama' };

  if (userRole === 'admin') {
    const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: from_shop_id } });
    if (!assignment) throw { status: 403, message: 'Anda hanya bisa membuat transfer dari toko Anda sendiri' };
  }

  const fromShop = await Shop.findByPk(from_shop_id);
  if (!fromShop) throw { status: 404, message: 'Toko asal tidak ditemukan' };
  const toShop = await Shop.findByPk(to_shop_id);
  if (!toShop) throw { status: 404, message: 'Toko tujuan tidak ditemukan' };

  if (!items || items.length === 0) throw { status: 400, message: 'Transfer harus memiliki minimal satu item' };

  const sequelize = Transfer.sequelize;
  const result = await sequelize.transaction(async (t) => {
    const transfer = await Transfer.create(
      { from_shop_id, to_shop_id, requested_by: userId, status: 'pending', note },
      { transaction: t }
    );

    for (const item of items) {
      const variant = await ProductVariant.findByPk(item.product_variant_id);
      if (!variant) throw { status: 404, message: `Variant ${item.product_variant_id} tidak ditemukan` };

      await TransferItem.create(
        { transfer_id: transfer.id, product_variant_id: item.product_variant_id, qty: item.qty, note: item.note || null },
        { transaction: t }
      );
    }

    return await Transfer.findByPk(transfer.id, {
      include: [...TRANSFER_INCLUDE, { model: TransferItem, as: 'items' }],
      transaction: t,
    });
  });

  await auditLogService.log({
    userId,
    shopId: from_shop_id,
    entityType: 'transfer',
    entityId: result.id,
    action: 'create',
    newValues: { from_shop_id, to_shop_id, note, item_count: items.length },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  // Beritahu admin toko tujuan bahwa ada transfer masuk
  notifService.notifyShopUsers(
    to_shop_id,
    'transfer_incoming',
    'Transfer Stok Masuk',
    `${fromShop.name} mengirimkan ${items.length} jenis barang ke toko Anda.`,
    { transfer_id: result.id, from_shop: fromShop.name },
    userId,
  ).catch(() => {});

  return result;
};

// ─── lists ─────────────────────────────────────────────────────────────────────

exports.listOutgoing = async (query, shopId, userId, userRole) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (userRole === 'superAdmin') {
    if (shopId) where.from_shop_id = shopId;
  } else {
    where.from_shop_id = shopId;
  }
  if (query.status) where.status = query.status;

  const { count, rows } = await Transfer.findAndCountAll({
    where,
    include: TRANSFER_INCLUDE,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.listIncoming = async (query, shopId, userId, userRole) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (userRole === 'superAdmin') {
    if (shopId) where.to_shop_id = shopId;
  } else {
    where.to_shop_id = shopId;
  }
  if (query.status) where.status = query.status;

  const { count, rows } = await Transfer.findAndCountAll({
    where,
    include: TRANSFER_INCLUDE,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.detail = async (transferId, userId, userRole) => {
  const transfer = await Transfer.findByPk(transferId, {
    include: [...TRANSFER_INCLUDE, { model: TransferItem, as: 'items' }],
  });
  if (!transfer) throw { status: 404, message: 'Transfer tidak ditemukan' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({
      where: {
        user_id: userId,
        shop_id: { [Op.in]: [transfer.from_shop_id, transfer.to_shop_id] },
      },
    });
    if (!assignment) throw { status: 403, message: 'Akses ke transfer ini tidak diizinkan' };
  }

  return transfer;
};

exports.items = async (transferId, userId, userRole) => {
  const transfer = await Transfer.findByPk(transferId);
  if (!transfer) throw { status: 404, message: 'Transfer tidak ditemukan' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({
      where: {
        user_id: userId,
        shop_id: { [Op.in]: [transfer.from_shop_id, transfer.to_shop_id] },
      },
    });
    if (!assignment) throw { status: 403, message: 'Akses tidak diizinkan' };
  }

  const rows = await TransferItem.findAll({
    where: { transfer_id: transferId },
    include: [
      {
        model: ProductVariant,
        attributes: ['id', 'name', 'sku', 'price'],
        include: [{ model: Product, attributes: ['id', 'name'] }],
      },
    ],
  });

  return rows.map((row) => {
    const plain = row.toJSON();
    // Normalisasi key asosiasi (Sequelize bisa return 'ProductVariant' atau 'product_variant')
    const variant = plain.ProductVariant ?? plain.product_variant ?? null;
    const product = variant?.Product ?? variant?.product ?? null;
    return {
      id: plain.id,
      transfer_id: plain.transfer_id,
      product_variant_id: plain.product_variant_id,
      qty: plain.qty,
      note: plain.note ?? null,
      product_name: product?.name ?? null,
      variant_name: variant?.name ?? null,
      variant_sku: variant?.sku ?? null,
    };
  });
};

// ─── approve ──────────────────────────────────────────────────────────────────

exports.approve = async (transferId, userId, userRole, ctx = {}) => {
  const transfer = await Transfer.findByPk(transferId, {
    include: [{ model: TransferItem, as: 'items' }],
  });
  if (!transfer) throw { status: 404, message: 'Transfer tidak ditemukan' };
  if (transfer.status !== 'pending') throw { status: 400, message: 'Transfer sudah diproses sebelumnya' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: transfer.to_shop_id } });
    if (!assignment) throw { status: 403, message: 'Hanya admin/kasir toko tujuan yang bisa menyetujui transfer ini' };
  }

  const sequelize = Transfer.sequelize;
  const result = await sequelize.transaction(async (t) => {
    for (const item of transfer.items) {
      const { product_variant_id, qty } = item;

      const sourceInv = await Inventory.findOne({
        where: { shop_id: transfer.from_shop_id, product_variant_id },
        transaction: t,
      });
      if (!sourceInv || sourceInv.stock < qty) {
        throw { status: 400, message: `Stok tidak mencukupi di toko asal untuk variant ${product_variant_id}` };
      }

      const srcStockBefore = sourceInv.stock;
      const srcAvg = parseFloat(sourceInv.avg_cost_price);
      const srcStockAfter = srcStockBefore - qty;

      await sourceInv.update({ stock: srcStockAfter }, { transaction: t });

      const [destInv] = await Inventory.findOrCreate({
        where: { shop_id: transfer.to_shop_id, product_variant_id },
        defaults: { shop_id: transfer.to_shop_id, product_variant_id, stock: 0, avg_cost_price: srcAvg },
        transaction: t,
      });

      const destStockBefore = destInv.stock;
      const destAvg = parseFloat(destInv.avg_cost_price);
      const newDestAvg = (destStockBefore * destAvg + qty * srcAvg) / (destStockBefore + qty);
      const destStockAfter = destStockBefore + qty;

      await destInv.update({ stock: destStockAfter, avg_cost_price: newDestAvg }, { transaction: t });

      await StockMovement.create(
        {
          shop_id: transfer.from_shop_id,
          user_id: userId,
          product_variant_id,
          transfer_id: transferId,
          type: 'transfer_out',
          qty: -qty,
          stock_before: srcStockBefore,
          stock_after: srcStockAfter,
          avg_cost_before: srcAvg,
          avg_cost_after: srcAvg,
        },
        { transaction: t }
      );

      await StockMovement.create(
        {
          shop_id: transfer.to_shop_id,
          user_id: userId,
          product_variant_id,
          transfer_id: transferId,
          type: 'transfer_in',
          qty,
          stock_before: destStockBefore,
          stock_after: destStockAfter,
          avg_cost_before: destAvg,
          avg_cost_after: newDestAvg,
        },
        { transaction: t }
      );
    }

    await transfer.update(
      { status: 'approved', confirmed_by: userId, confirmed_at: new Date() },
      { transaction: t }
    );

    return transfer.reload({ include: TRANSFER_INCLUDE, transaction: t });
  });

  await auditLogService.log({
    userId,
    shopId: transfer.to_shop_id,
    entityType: 'transfer',
    entityId: transferId,
    action: 'approve',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  // Beritahu semua user toko asal (+ superAdmin) bahwa transfer disetujui
  notifService.notifyShopUsers(
    transfer.from_shop_id,
    'transfer_confirmed',
    'Transfer Stok Disetujui',
    `Transfer stok ke ${result.toShop?.name ?? 'toko tujuan'} telah disetujui dan stok sudah dipindahkan.`,
    { transfer_id: transferId },
  ).catch(() => {});

  return result;
};

// ─── reject ───────────────────────────────────────────────────────────────────

exports.reject = async (transferId, userId, userRole, ctx = {}) => {
  const transfer = await Transfer.findByPk(transferId);
  if (!transfer) throw { status: 404, message: 'Transfer tidak ditemukan' };
  if (transfer.status !== 'pending') throw { status: 400, message: 'Transfer sudah diproses sebelumnya' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: transfer.to_shop_id } });
    if (!assignment) throw { status: 403, message: 'Hanya admin toko tujuan yang bisa menolak transfer ini' };
  }

  await transfer.update({ status: 'rejected', confirmed_by: userId, confirmed_at: new Date() });
  const result = await transfer.reload({ include: TRANSFER_INCLUDE });

  await auditLogService.log({
    userId,
    shopId: transfer.to_shop_id,
    entityType: 'transfer',
    entityId: transferId,
    action: 'reject',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  // Beritahu semua user toko asal (+ superAdmin) bahwa transfer ditolak
  notifService.notifyShopUsers(
    transfer.from_shop_id,
    'transfer_rejected',
    'Transfer Stok Ditolak',
    `Transfer stok ke ${result.toShop?.name ?? 'toko tujuan'} ditolak oleh admin toko tujuan.`,
    { transfer_id: transferId },
  ).catch(() => {});

  return result;
};

// ─── cancel ───────────────────────────────────────────────────────────────────

exports.cancel = async (transferId, userId, userRole, ctx = {}) => {
  const transfer = await Transfer.findByPk(transferId);
  if (!transfer) throw { status: 404, message: 'Transfer tidak ditemukan' };
  if (transfer.status !== 'pending') throw { status: 400, message: 'Hanya transfer berstatus pending yang bisa dibatalkan' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: transfer.from_shop_id } });
    if (!assignment) throw { status: 403, message: 'Hanya admin toko pengirim yang bisa membatalkan transfer ini' };
  }

  await transfer.update({ status: 'cancelled', confirmed_at: new Date() });
  const result = await transfer.reload({ include: TRANSFER_INCLUDE });

  await auditLogService.log({
    userId,
    shopId: transfer.from_shop_id,
    entityType: 'transfer',
    entityId: transferId,
    action: 'cancel',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};
