'use strict';

const { Op } = require('sequelize');
const { Customer, Transaction, TransactionItem } = require('../models');
const { getPagination, getMeta } = require('../utils/pagination');
const auditLogService = require('./auditLog.service');

exports.list = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};
  if (query.search) {
    where[Op.or] = [
      { name: { [Op.iLike]: `%${query.search}%` } },
      { phone: { [Op.iLike]: `%${query.search}%` } },
      { email: { [Op.iLike]: `%${query.search}%` } },
    ];
  }

  const { count, rows } = await Customer.findAndCountAll({ where, limit, offset, order: [['name', 'ASC']] });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.create = async ({ name, phone, email, address }, ctx = {}) => {
  if (phone) {
    const existing = await Customer.findOne({ where: { phone } });
    if (existing) throw { status: 409, message: 'Nomor telepon sudah terdaftar' };
  }
  if (email) {
    const existing = await Customer.findOne({ where: { email } });
    if (existing) throw { status: 409, message: 'Email customer sudah terdaftar' };
  }

  const customer = await Customer.create({ name, phone, email, address });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: 'customer',
    entityId: customer.id,
    action: 'create',
    newValues: customer.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return customer;
};

exports.detail = async (customerId) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) throw { status: 404, message: 'Customer tidak ditemukan' };
  return customer;
};

exports.update = async (customerId, body, ctx = {}) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) throw { status: 404, message: 'Customer tidak ditemukan' };

  const { name, phone, email, address } = body;

  if (phone && phone !== customer.phone) {
    const existing = await Customer.findOne({ where: { phone } });
    if (existing) throw { status: 409, message: 'Nomor telepon sudah terdaftar' };
  }
  if (email && email !== customer.email) {
    const existing = await Customer.findOne({ where: { email } });
    if (existing) throw { status: 409, message: 'Email customer sudah terdaftar' };
  }

  const oldValues = customer.toJSON();
  await customer.update({ name, phone, email, address });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: 'customer',
    entityId: customerId,
    action: 'update',
    oldValues,
    newValues: customer.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return customer;
};

exports.remove = async (customerId, ctx = {}) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) throw { status: 404, message: 'Customer tidak ditemukan' };

  const oldValues = customer.toJSON();
  await customer.destroy();

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: 'customer',
    entityId: customerId,
    action: 'delete',
    oldValues,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

exports.transactions = async (customerId, query) => {
  const customer = await Customer.findByPk(customerId);
  if (!customer) throw { status: 404, message: 'Customer tidak ditemukan' };

  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await Transaction.findAndCountAll({
    where: { customer_id: customerId },
    include: [{ model: TransactionItem }],
    limit,
    offset,
    order: [['created_at', 'DESC']],
    distinct: true,
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};
