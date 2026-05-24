'use strict';

const { Op } = require('sequelize');
const {
  Transaction, TransactionItem, Inventory, StockMovement,
  ProductVariant, Product, Customer, Shop, User, UserShop,
} = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService    = require('./auditLog.service');
const notifService       = require('./notification.service');

const ITEM_INCLUDE = [
  {
    model: ProductVariant,
    attributes: ['id', 'name', 'sku', 'price'],
    include: [{ model: Product, attributes: ['id', 'name'] }],
  },
];

const TRX_INCLUDE = [
  { model: Shop, attributes: ['id', 'name'] },
  { model: User, attributes: ['id', 'name'] },
  { model: Customer, attributes: ['id', 'name', 'phone'] },
];

// ─── list ─────────────────────────────────────────────────────────────────────

exports.list = async (query, shopId, userRole) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (userRole === 'superAdmin') {
    if (shopId) where.shop_id = shopId;
  } else {
    where.shop_id = shopId;
  }

  if (query.status) where.status = query.status;
  if (query.payment_method) where.payment_method = query.payment_method;
  if (query.customer_id) where.customer_id = query.customer_id;
  if (query.user_id) where.user_id = query.user_id;
  if (query.date_from || query.date_to) {
    where.created_at = {};
    if (query.date_from) where.created_at[Op.gte] = new Date(query.date_from);
    if (query.date_to) where.created_at[Op.lte] = new Date(query.date_to);
  }

  const { count, rows } = await Transaction.findAndCountAll({
    where,
    include: TRX_INCLUDE,
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { data: rows, meta: getMeta(count, page, limit) };
};

// ─── detail ───────────────────────────────────────────────────────────────────

exports.detail = async (transactionId, shopId, userRole) => {
  const trx = await Transaction.findByPk(transactionId, {
    include: [...TRX_INCLUDE, { model: TransactionItem, as: 'items', include: ITEM_INCLUDE }],
  });

  if (!trx) throw { status: 404, message: 'Transaksi tidak ditemukan' };

  if (userRole !== 'superAdmin' && trx.shop_id !== shopId) {
    throw { status: 403, message: 'Akses ke transaksi ini tidak diizinkan' };
  }

  return trx;
};

// ─── receipt ──────────────────────────────────────────────────────────────────

exports.getReceipt = async (transactionId, shopId, userRole) => {
  const trx = await Transaction.findByPk(transactionId, {
    include: [
      { model: Shop,     attributes: ['id', 'name', 'address', 'phone'] },
      { model: User,     attributes: ['id', 'name'] },
      { model: Customer, attributes: ['id', 'name', 'phone'] },
      {
        model: TransactionItem, as: 'items',
        include: [{
          model: ProductVariant,
          attributes: ['id', 'name', 'sku', 'barcode', 'price'],
          include: [{ model: Product, attributes: ['id', 'name'] }],
        }],
      },
    ],
  });

  if (!trx) throw { status: 404, message: 'Transaksi tidak ditemukan' };
  if (userRole !== 'superAdmin' && trx.shop_id !== shopId) {
    throw { status: 403, message: 'Akses ke transaksi ini tidak diizinkan' };
  }

  const plain = trx.toJSON();

  return {
    invoice_no:     plain.invoice_no,
    status:         plain.status,
    payment_method: plain.payment_method,
    paid_at:        plain.paid_at,
    note:           plain.note,
    subtotal:       parseFloat(plain.subtotal),
    created_at:     plain.created_at,
    shop: {
      name:    plain.Shop?.name    ?? '-',
      address: plain.Shop?.address ?? null,
      phone:   plain.Shop?.phone   ?? null,
    },
    cashier: {
      name: plain.User?.name ?? '-',
    },
    customer: plain.Customer
      ? { name: plain.Customer.name, phone: plain.Customer.phone }
      : null,
    items: (plain.items ?? []).map(item => ({
      product_name: item.ProductVariant?.Product?.name  ?? '-',
      variant_name: item.ProductVariant?.name           ?? '-',
      sku:          item.ProductVariant?.sku            ?? '-',
      barcode:      item.ProductVariant?.barcode        ?? null,
      qty:          item.qty,
      price:        parseFloat(item.price),
      subtotal:     parseFloat(item.subtotal),
    })),
  };
};

// ─── create ───────────────────────────────────────────────────────────────────

const generateInvoiceNo = async (t) => {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const monthStart = new Date(`${yyyy}-${mm}-01T00:00:00.000Z`);
  const nextMonth = new Date(monthStart);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const count = await Transaction.count({
    where: { created_at: { [Op.gte]: monthStart, [Op.lt]: nextMonth } },
    transaction: t,
  });

  return `INV/${yyyy}/${mm}/${String(count + 1).padStart(6, '0')}`;
};

exports.create = async ({ shop_id, customer_id, payment_method, note, items }, userId, userRole, ctx = {}) => {
  if (!items || items.length === 0)
    throw { status: 400, message: 'Transaksi harus memiliki minimal satu item' };

  const validMethods = ['cash', 'qris'];
  if (!validMethods.includes(payment_method))
    throw { status: 400, message: `Metode pembayaran tidak valid. Pilih: ${validMethods.join(', ')}` };

  const shop = await Shop.findByPk(shop_id);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  if (userRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id } });
    if (!assignment) throw { status: 403, message: 'Anda tidak memiliki akses ke toko ini' };
  }

  if (customer_id) {
    const customer = await Customer.findByPk(customer_id);
    if (!customer) throw { status: 404, message: 'Customer tidak ditemukan' };
  }

  const sequelize = Transaction.sequelize;
  const result = await sequelize.transaction(async (t) => {
    const invoice_no = await generateInvoiceNo(t);

    let subtotal = 0;
    const resolved = [];

    for (const item of items) {
      if (!item.product_variant_id || !item.qty || item.qty < 1)
        throw { status: 400, message: 'Setiap item wajib memiliki product_variant_id dan qty > 0' };

      const variant = await ProductVariant.findByPk(item.product_variant_id, { transaction: t });
      if (!variant) throw { status: 404, message: `Varian produk ${item.product_variant_id} tidak ditemukan` };

      const inventory = await Inventory.findOne({
        where: { shop_id, product_variant_id: item.product_variant_id },
        transaction: t,
      });
      if (!inventory)
        throw { status: 400, message: `Produk "${variant.name}" tidak tersedia di toko ini` };
      if (inventory.stock < item.qty)
        throw { status: 400, message: `Stok "${variant.name}" tidak mencukupi (tersisa: ${inventory.stock})` };

      const price = item.price !== undefined ? parseFloat(item.price) : parseFloat(variant.price);
      const itemSubtotal = price * item.qty;
      subtotal += itemSubtotal;

      resolved.push({ variant, inventory, item: { ...item, price }, itemSubtotal });
    }

    const status = 'selesai';
    const paid_at = new Date();

    const trx = await Transaction.create(
      {
        shop_id,
        user_id: userId,
        customer_id: customer_id || null,
        invoice_no,
        status,
        payment_method,
        paid_at,
        subtotal,
        note: note || null,
      },
      { transaction: t }
    );

    for (const { variant, inventory, item, itemSubtotal } of resolved) {
      const costPrice = parseFloat(inventory.avg_cost_price);
      const stockBefore = inventory.stock;
      const stockAfter = stockBefore - item.qty;

      await TransactionItem.create(
        {
          transaction_id: trx.id,
          product_variant_id: item.product_variant_id,
          qty: item.qty,
          price: item.price,
          cost_price: costPrice,
          subtotal: itemSubtotal,
        },
        { transaction: t }
      );

      await inventory.update({ stock: stockAfter }, { transaction: t });

      await StockMovement.create(
        {
          shop_id,
          user_id: userId,
          product_variant_id: item.product_variant_id,
          transaction_id: trx.id,
          type: 'sale',
          qty: -item.qty,
          cost_price: costPrice,
          stock_before: stockBefore,
          stock_after: stockAfter,
          avg_cost_before: costPrice,
          avg_cost_after: costPrice,
        },
        { transaction: t }
      );
    }

    return await Transaction.findByPk(trx.id, {
      include: [...TRX_INCLUDE, { model: TransactionItem, as: 'items', include: ITEM_INCLUDE }],
      transaction: t,
    });
  });

  await auditLogService.log({
    userId,
    shopId: shop_id,
    entityType: 'transaction',
    entityId: result.id,
    action: 'create',
    newValues: { invoice_no: result.invoice_no, subtotal: result.subtotal, payment_method, status: result.status },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  // Fire-and-forget: cek stok kritis setelah transaksi
  const soldVariantIds = items.map((i) => i.product_variant_id);
  notifService.checkAndNotifyLowStock(shop_id, soldVariantIds).catch(() => {});

  return result;
};

// ─── cancel ───────────────────────────────────────────────────────────────────

exports.cancel = async (transactionId, shopId, userId, userRole, ctx = {}) => {
  const trx = await Transaction.findByPk(transactionId, {
    include: [{ model: TransactionItem, as: 'items' }],
  });
  if (!trx) throw { status: 404, message: 'Transaksi tidak ditemukan' };

  if (userRole !== 'superAdmin' && trx.shop_id !== shopId)
    throw { status: 403, message: 'Akses ke transaksi ini tidak diizinkan' };

  if (trx.status === 'refunded')
    throw { status: 400, message: 'Transaksi sudah dibatalkan sebelumnya' };

  const sequelize = Transaction.sequelize;
  const result = await sequelize.transaction(async (t) => {
    for (const item of trx.items) {
      const inventory = await Inventory.findOne({
        where: { shop_id: trx.shop_id, product_variant_id: item.product_variant_id },
        transaction: t,
      });

      if (inventory) {
        const stockBefore = inventory.stock;
        const stockAfter = stockBefore + item.qty;
        const costPrice = parseFloat(item.cost_price);

        await inventory.update({ stock: stockAfter }, { transaction: t });

        await StockMovement.create(
          {
            shop_id: trx.shop_id,
            user_id: userId,
            product_variant_id: item.product_variant_id,
            transaction_id: trx.id,
            type: 'refund',
            qty: item.qty,
            cost_price: costPrice,
            stock_before: stockBefore,
            stock_after: stockAfter,
            avg_cost_before: costPrice,
            avg_cost_after: costPrice,
            note: 'Pembatalan transaksi',
          },
          { transaction: t }
        );
      }
    }

    await trx.update({ status: 'refunded', paid_at: null }, { transaction: t });
    return trx.reload({ transaction: t });
  });

  await auditLogService.log({
    userId,
    shopId: trx.shop_id,
    entityType: 'transaction',
    entityId: transactionId,
    action: 'cancel',
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};
