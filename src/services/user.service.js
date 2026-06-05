'use strict';

const { Op } = require('sequelize');
const { User, UserShop } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService = require('./auditLog.service');

const SAFE_ATTRS = ['id', 'name', 'email', 'role', 'phone', 'image_url', 'is_active', 'created_at'];

exports.list = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (query.role) where.role = query.role;
  if (query.is_active !== undefined) where.is_active = query.is_active === 'true';
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${query.search}%` } },
      { email: { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: SAFE_ATTRS,
    include: [{ model: UserShop, attributes: ['shop_id'] }],
    limit,
    offset,
    order: [['name', 'ASC']],
    distinct: true,
  });

  const data = rows.map((u) => {
    const plain = u.toJSON();
    plain.shopId = plain.UserShops?.[0]?.shop_id ?? null;
    delete plain.UserShops;
    return plain;
  });

  return { data, meta: getMeta(count, page, limit) };
};

exports.detail = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: SAFE_ATTRS,
    include: [{ model: UserShop, attributes: ['shop_id'] }],
  });
  if (!user) throw { status: 404, message: 'User tidak ditemukan' };
  const plain = user.toJSON();
  plain.shopId = plain.UserShops?.[0]?.shop_id ?? null;
  delete plain.UserShops;
  return plain;
};

exports.update = async (userId, { name, phone, role, is_active, shopId }, ctx = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: 'User tidak ditemukan' };

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;

  const oldValues = { name: user.name, phone: user.phone, role: user.role, is_active: user.is_active };
  await user.update(updates);

  if (shopId !== undefined) {
    await UserShop.destroy({ where: { user_id: userId } });
    if (shopId) await UserShop.create({ user_id: userId, shop_id: shopId });
  }

  await auditLogService.log({
    userId: ctx.userId,
    shopId: shopId ?? null,
    entityType: 'user',
    entityId: userId,
    action: 'update',
    oldValues,
    newValues: { ...updates, ...(shopId !== undefined ? { shopId } : {}) },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return exports.detail(userId);
};
