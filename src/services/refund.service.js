'use strict';

const { Op } = require('sequelize');
const {
  Refund, RefundItem, Transaction, TransactionItem,
  Inventory, StockMovement, User, Shop, UserShop,
} = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService = require('./auditLog.service');
const notifService    = require('./notification.service');

const REFUND_INCLUDE = [
  { model: User, attributes: ['id', 'name'] },
];

const ITEM_INCLUDE = [
  {
    model: TransactionItem,
    attributes: ['id', 'product_variant_id', 'qty', 'price'],
  },
];

// ─── list ─────────────────────────────────────────────────────────────────────

exports.list = async (query, shopId, userRole) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};
  const transactionWhere = {};

  if (userRole === 'superAdmin') {
    if (shopId) transactionWhere.shop_id = shopId;
  } else {
    transactionWhere.shop_id = shopId;
  }

  if (query.transaction_id) where.transaction_id = query.transaction_id;

  const { count, rows } = await Refund.findAndCountAll({
    where,
    include: [
      ...REFUND_INCLUDE,
      {
        model: Transaction,
        attributes: ['id', 'invoice_no', 'shop_id'],
        where: transactionWhere,
        include: [{ model: Shop, attributes: ['id', 'name'] }],
      },
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { data: rows, meta: getMeta(count, page, limit) };
};

// ─── detail ───────────────────────────────────────────────────────────────────

exports.detail = async (refundId, shopId, userRole) => {
  const refund = await Refund.findByPk(refundId, {
    include: [
      ...REFUND_INCLUDE,
      {
        model: Transaction,
        attributes: ['id', 'invoice_no', 'shop_id'],
        include: [{ model: Shop, attributes: ['id', 'name'] }],
      },
      { model: RefundItem, as: 'items', include: ITEM_INCLUDE },
    ],
  });

  if (!refund) throw { status: 404, message: 'Refund tidak ditemukan' };

  if (userRole !== 'superAdmin' && refund.Transaction.shop_id !== shopId)
    throw { status: 403, message: 'Akses ke refund ini tidak diizinkan' };

  return refund;
};

// ─── create ───────────────────────────────────────────────────────────────────

exports.create = async ({ invoice_no, reason, items }, userId, userRole, ctx = {}) => {
  if (!items || items.length === 0)
    throw { status: 400, message: 'Refund harus memiliki minimal satu item' };

  const trx = await Transaction.findOne({ where: { invoice_no } });
  if (!trx) throw { status: 404, message: 'Transaksi tidak ditemukan' };
  const transaction_id = trx.id;
  if (trx.status !== 'selesai')
    throw { status: 400, message: 'Hanya transaksi yang sudah selesai yang bisa direfund' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: trx.shop_id } });
    if (!assignment) throw { status: 403, message: 'Akses ke transaksi ini tidak diizinkan' };
  }

  const sequelize = Refund.sequelize;
  const result = await sequelize.transaction(async (t) => {
    let totalAmount = 0;
    const resolved = [];

    for (const item of items) {
      if (!item.transaction_item_id || !item.qty || item.qty < 1)
        throw { status: 400, message: 'Setiap item wajib memiliki transaction_item_id dan qty > 0' };

      const txItem = await TransactionItem.findByPk(item.transaction_item_id, { transaction: t });
      if (!txItem) throw { status: 404, message: `Transaction item ${item.transaction_item_id} tidak ditemukan` };
      if (txItem.transaction_id !== transaction_id)
        throw { status: 400, message: `Item ${item.transaction_item_id} bukan bagian dari transaksi ini` };
      if (item.qty > txItem.qty)
        throw { status: 400, message: `Qty refund melebihi qty pembelian untuk item ${item.transaction_item_id}` };

      const approvedRefundIds = (await Refund.findAll({
        where: { transaction_id, status: 'approved' },
        attributes: ['id'],
        transaction: t,
      })).map((r) => r.id);

      const alreadyRefunded = approvedRefundIds.length > 0
        ? (await RefundItem.sum('qty', {
            where: {
              transaction_item_id: item.transaction_item_id,
              refund_id: { [Op.in]: approvedRefundIds },
            },
            transaction: t,
          })) || 0
        : 0;
      if (alreadyRefunded + item.qty > txItem.qty)
        throw { status: 400, message: `Total qty refund melebihi qty pembelian untuk item ${item.transaction_item_id}` };

      const amount = parseFloat(txItem.price) * item.qty;
      totalAmount += amount;
      resolved.push({ txItem, item, amount });
    }

    // Buat refund langsung dengan status approved
    const refund = await Refund.create(
      { user_id: userId, transaction_id, reason: reason || null, total_amount: totalAmount, status: 'approved' },
      { transaction: t }
    );

    for (const { txItem, item, amount } of resolved) {
      await RefundItem.create(
        { refund_id: refund.id, transaction_item_id: item.transaction_item_id, qty: item.qty, amount },
        { transaction: t }
      );

      // Kembalikan stok ke inventory
      const inventory = await Inventory.findOne({
        where: { shop_id: trx.shop_id, product_variant_id: txItem.product_variant_id },
        transaction: t,
      });

      if (inventory) {
        const stockBefore = inventory.stock;
        const stockAfter = stockBefore + item.qty;
        const costPrice = parseFloat(txItem.cost_price);

        await inventory.update({ stock: stockAfter }, { transaction: t });

        await StockMovement.create(
          {
            shop_id: trx.shop_id,
            user_id: userId,
            product_variant_id: txItem.product_variant_id,
            transaction_id,
            type: 'refund',
            qty: item.qty,
            cost_price: costPrice,
            stock_before: stockBefore,
            stock_after: stockAfter,
            avg_cost_before: costPrice,
            avg_cost_after: costPrice,
            note: `Refund #${refund.id}`,
          },
          { transaction: t }
        );
      }
    }

    return await Refund.findByPk(refund.id, {
      include: [
        ...REFUND_INCLUDE,
        { model: Transaction, attributes: ['id', 'invoice_no', 'shop_id'] },
        { model: RefundItem, as: 'items', include: ITEM_INCLUDE },
      ],
      transaction: t,
    });
  });

  await auditLogService.log({
    userId,
    shopId: trx.shop_id,
    entityType: 'refund',
    entityId: result.id,
    action: 'create',
    newValues: { transaction_id, reason: reason || null, total_amount: result.total_amount },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  // Beritahu admin toko bahwa ada refund baru
  notifService.notifyShopUsers(
    trx.shop_id,
    'refund',
    'Refund Baru Diproses',
    `Refund untuk transaksi ${trx.invoice_no} sebesar Rp ${Number(result.total_amount).toLocaleString('id-ID')} telah diproses.`,
    { refund_id: result.id, transaction_id, invoice_no: trx.invoice_no, total_amount: result.total_amount },
  ).catch(() => {});

  return result;
};
