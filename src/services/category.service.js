'use strict';

const { Category } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService = require('./auditLog.service');

exports.list = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await Category.findAndCountAll({ limit, offset, order: [['name', 'ASC']] });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.create = async ({ name }, ctx = {}) => {
  const existing = await Category.findOne({ where: { name } });
  if (existing) throw { status: 409, message: 'Nama kategori sudah ada' };

  const category = await Category.create({ name });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: null,
    entityType: 'category',
    entityId: category.id,
    action: 'create',
    newValues: category.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return category;
};

exports.update = async (categoryId, { name }, ctx = {}) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw { status: 404, message: 'Kategori tidak ditemukan' };

  if (name && name !== category.name) {
    const existing = await Category.findOne({ where: { name } });
    if (existing) throw { status: 409, message: 'Nama kategori sudah ada' };
  }

  const oldValues = category.toJSON();
  await category.update({ name });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: null,
    entityType: 'category',
    entityId: categoryId,
    action: 'update',
    oldValues,
    newValues: category.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return category;
};

exports.remove = async (categoryId, ctx = {}) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw { status: 404, message: 'Kategori tidak ditemukan' };

  const oldValues = category.toJSON();
  await category.destroy();

  await auditLogService.log({
    userId: ctx.userId,
    shopId: null,
    entityType: 'category',
    entityId: categoryId,
    action: 'delete',
    oldValues,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};
