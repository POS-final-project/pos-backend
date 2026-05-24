'use strict';

const { Op } = require('sequelize');
const { Notification, UserShop, User, Inventory, ProductVariant, Product, sequelize } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');

// ─── Core create ─────────────────────────────────────────────────────────────

async function create(userId, shopId, type, title, body, data = null) {
  return Notification.create({ user_id: userId, shop_id: shopId, type, title, body, data });
}

// ─── Collect all user IDs that should receive a shop-scoped notification ──────
// Includes: users assigned to the shop via UserShop + ALL active superAdmins.

async function resolveRecipients(shopId, excludeUserId = null) {
  const [assignments, superAdmins] = await Promise.all([
    UserShop.findAll({ where: { shop_id: shopId }, attributes: ['user_id'] }),
    User.findAll({ where: { role: 'superAdmin', is_active: true }, attributes: ['id'] }),
  ]);

  const seen = new Set();
  const ids  = [];

  for (const a of assignments) {
    if (excludeUserId && a.user_id === excludeUserId) continue;
    if (!seen.has(a.user_id)) { seen.add(a.user_id); ids.push(a.user_id); }
  }
  for (const u of superAdmins) {
    // SuperAdmin selalu dapat notif — tidak ada pengecualian berdasarkan siapa yang memicu
    if (!seen.has(u.id)) { seen.add(u.id); ids.push(u.id); }
  }

  return ids;
}

// ─── Notify all users assigned to a shop (+ all superAdmins) ─────────────────

async function notifyShopUsers(shopId, type, title, body, data = null, excludeUserId = null) {
  const recipients = await resolveRecipients(shopId, excludeUserId);
  for (const userId of recipients) {
    await create(userId, shopId, type, title, body, data).catch(() => {});
  }
}

// ─── Low-stock check (called after transaction completes) ────────────────────
// Skips if an unread low_stock notification already exists for the same item.

async function checkAndNotifyLowStock(shopId, variantIds) {
  if (!variantIds || variantIds.length === 0) return;

  const { QueryTypes } = require('sequelize');
  const lowItems = await sequelize.query(`
    SELECT i.id AS inventory_id, i.stock, i.low_stock_threshold AS threshold,
           pv.id AS variant_id, pv.name AS variant_name,
           p.name  AS product_name
    FROM inventory i
    JOIN product_variants pv ON pv.id = i.product_variant_id
    JOIN products         p  ON p.id  = pv.product_id
    WHERE i.shop_id = :shopId
      AND i.product_variant_id IN (:variantIds)
      AND i.stock <= i.low_stock_threshold
  `, { replacements: { shopId, variantIds }, type: QueryTypes.SELECT });

  for (const item of lowItems) {
    const label = `${item.product_name} — ${item.variant_name}`;
    const body   = item.stock === 0
      ? `${label} sudah habis!`
      : `${label} tersisa ${item.stock} unit (threshold: ${item.threshold})`;

    const recipients = await resolveRecipients(shopId);
    for (const userId of recipients) {
      // Skip if user already has an unread low_stock notif for this variant
      const dup = await Notification.findOne({
        where: {
          user_id: userId,
          type: 'low_stock',
          is_read: false,
          data: { [Op.contains]: { variant_id: item.variant_id } },
        },
      });
      if (dup) continue;

      await create(
        userId, shopId, 'low_stock',
        item.stock === 0 ? 'Stok Habis!' : 'Stok Hampir Habis',
        body,
        { inventory_id: item.inventory_id, variant_id: item.variant_id, stock: item.stock, threshold: item.threshold },
      ).catch(() => {});
    }
  }
}

// ─── Query helpers ────────────────────────────────────────────────────────────

async function list(userId, query = {}) {
  const { page, limit, offset } = getPagination(query);
  const where = { user_id: userId };
  if (query.unread === 'true') where.is_read = false;

  const { count, rows } = await Notification.findAndCountAll({
    where,
    limit,
    offset,
    order: [['created_at', 'DESC']],
  });

  return { data: rows, meta: getMeta(count, page, limit) };
}

async function unreadCount(userId) {
  return Notification.count({ where: { user_id: userId, is_read: false } });
}

async function markRead(id, userId) {
  const notif = await Notification.findOne({ where: { id, user_id: userId } });
  if (!notif) throw { status: 404, message: 'Notifikasi tidak ditemukan' };
  await notif.update({ is_read: true });
  return notif;
}

async function markAllRead(userId) {
  await Notification.update({ is_read: true }, { where: { user_id: userId, is_read: false } });
}

module.exports = {
  create,
  notifyShopUsers,
  checkAndNotifyLowStock,
  list,
  unreadCount,
  markRead,
  markAllRead,
};
