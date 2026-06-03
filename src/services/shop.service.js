'use strict';

const { Op } = require('sequelize');
const { Shop, User, UserShop } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService = require('./auditLog.service');

exports.list = async (query, requesterId, requesterRole) => {
  const { page, limit, offset } = getPagination(query);
  const where = { is_active: true };

  // all=1: return all active shops regardless of role (dipakai untuk dropdown tujuan transfer)
  if (requesterRole !== 'superAdmin' && query.all !== '1') {
    const assignments = await UserShop.findAll({ where: { user_id: requesterId } });
    const shopIds = assignments.map((a) => a.shop_id);
    where.id = { [Op.in]: shopIds };
  }

  const { count, rows } = await Shop.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.create = async ({ name, address, phone }, ctx = {}) => {
  const shop = await Shop.create({ name, address, phone });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: shop.id,
    entityType: 'shop',
    entityId: shop.id,
    action: 'create',
    newValues: shop.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return shop;
};

exports.detail = async (shopId, requesterId, requesterRole) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  if (requesterRole !== 'superAdmin') {
    const assignment = await UserShop.findOne({ where: { user_id: requesterId, shop_id: shopId } });
    if (!assignment) throw { status: 403, message: 'Akses ke toko ini tidak diizinkan' };
  }
  return shop;
};

exports.update = async (shopId, requesterId, requesterRole, body, ctx = {}) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  if (requesterRole === 'admin') {
    const assignment = await UserShop.findOne({ where: { user_id: requesterId, shop_id: shopId } });
    if (!assignment) throw { status: 403, message: 'Anda hanya bisa mengubah toko sendiri' };
  }

  const { name, address, phone, is_active } = body;
  const oldValues = shop.toJSON();
  await shop.update({ name, address, phone, is_active });

  await auditLogService.log({
    userId: ctx.userId,
    shopId,
    entityType: 'shop',
    entityId: shopId,
    action: 'update',
    oldValues,
    newValues: shop.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return shop;
};

exports.remove = async (shopId, ctx = {}) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  const oldValues = shop.toJSON();
  await shop.update({ is_active: false });

  await auditLogService.log({
    userId: ctx.userId,
    shopId,
    entityType: 'shop',
    entityId: shopId,
    action: 'delete',
    oldValues,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

exports.assignStaff = async (shopId, requesterId, requesterRole, { userId }, ctx = {}) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  if (requesterRole === 'admin') {
    const myAssignment = await UserShop.findOne({ where: { user_id: requesterId, shop_id: shopId } });
    if (!myAssignment) throw { status: 403, message: 'Anda tidak bisa mengelola toko ini' };
  }

  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: 'User tidak ditemukan' };

  const existing = await UserShop.findOne({ where: { user_id: userId, shop_id: shopId } });
  if (existing) throw { status: 409, message: 'User sudah ditugaskan ke toko ini' };

  const assignment = await UserShop.create({ user_id: userId, shop_id: shopId });

  await auditLogService.log({
    userId: ctx.userId,
    shopId,
    entityType: 'shop',
    entityId: shopId,
    action: 'assign_staff',
    newValues: { userId, shopId },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

exports.removeStaff = async (shopId, requesterId, requesterRole, userId, ctx = {}) => {
  if (requesterRole === 'admin') {
    const myAssignment = await UserShop.findOne({ where: { user_id: requesterId, shop_id: shopId } });
    if (!myAssignment) throw { status: 403, message: 'Anda tidak bisa mengelola toko ini' };
  }

  const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: shopId } });
  if (!assignment) throw { status: 404, message: 'Staff tidak ditemukan di toko ini' };
  await assignment.destroy();

  await auditLogService.log({
    userId: ctx.userId,
    shopId,
    entityType: 'shop',
    entityId: shopId,
    action: 'remove_staff',
    oldValues: { userId, shopId },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

exports.listStaff = async (shopId, requesterId, requesterRole) => {
  const shop = await Shop.findByPk(shopId);
  if (!shop) throw { status: 404, message: 'Toko tidak ditemukan' };

  if (requesterRole === 'admin') {
    const myAssignment = await UserShop.findOne({ where: { user_id: requesterId, shop_id: shopId } });
    if (!myAssignment) throw { status: 403, message: 'Akses ke toko ini tidak diizinkan' };
  }

  const staff = await UserShop.findAll({
    where: { shop_id: shopId },
    include: [{ model: User, attributes: ['id', 'name', 'email', 'role', 'is_active', 'phone'] }],
  });
  return staff.map((s) => s.User);
};
