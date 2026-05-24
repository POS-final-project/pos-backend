'use strict';

const { Op } = require('sequelize');
const { User } = require('../models');
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
    limit,
    offset,
    order: [['name', 'ASC']],
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.detail = async (userId) => {
  const user = await User.findByPk(userId, { attributes: SAFE_ATTRS });
  if (!user) throw { status: 404, message: 'User tidak ditemukan' };
  return user;
};

exports.update = async (userId, { name, phone, role, is_active }, ctx = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: 'User tidak ditemukan' };

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (role !== undefined) updates.role = role;
  if (is_active !== undefined) updates.is_active = is_active;

  const oldValues = { name: user.name, phone: user.phone, role: user.role, is_active: user.is_active };
  await user.update(updates);

  await auditLogService.log({
    userId: ctx.userId,
    shopId: null,
    entityType: 'user',
    entityId: userId,
    action: 'update',
    oldValues,
    newValues: updates,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return user.reload({ attributes: SAFE_ATTRS });
};
