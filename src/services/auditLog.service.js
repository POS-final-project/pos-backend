'use strict';

const { Op } = require('sequelize');
const { AuditLog, User, Shop } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');

// ─── log (utility dipanggil service lain) ────────────────────────────────────

exports.log = async ({ userId, shopId, entityType, entityId, action, oldValues, newValues, ipAddress, userAgent }) => {
  try {
    await AuditLog.create({
      user_id: userId || null,
      shop_id: shopId || null,
      entity_type: entityType,
      entity_id: entityId,
      action,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
    });
  } catch {
    // Audit log failure should never crash the main operation
  }
};

// ─── list ─────────────────────────────────────────────────────────────────────

exports.list = async (query, shopId, userRole) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (userRole === 'superAdmin') {
    if (shopId) where.shop_id = shopId;
  } else {
    // Admin sees their shop's logs AND global logs (shop_id = null) for entities
    // like products and users that are not scoped to a single shop.
    where[Op.or] = [{ shop_id: shopId }, { shop_id: null }];
  }

  if (query.entity_type) where.entity_type = query.entity_type;
  if (query.action) where.action = query.action;
  if (query.user_id) where.user_id = query.user_id;
  if (query.date_from || query.date_to) {
    where.created_at = {};
    if (query.date_from) where.created_at[Op.gte] = new Date(query.date_from);
    if (query.date_to) where.created_at[Op.lte] = new Date(query.date_to);
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [
      { model: User, attributes: ['id', 'name', 'email'], required: false },
      { model: Shop, attributes: ['id', 'name'], required: false },
    ],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });

  return { data: rows, meta: getMeta(count, page, limit) };
};
