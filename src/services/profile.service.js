"use strict";

const { User } = require("../models");
const auditLogService = require("./auditLog.service");

const SAFE_ATTRS = [
  "id",
  "name",
  "email",
  "role",
  "phone",
  "image_url",
  "is_active",
  "created_at",
  "updated_at",
];

exports.getMe = async (userId) => {
  const user = await User.findByPk(userId, { attributes: SAFE_ATTRS });
  if (!user) throw { status: 404, message: "User tidak ditemukan" };
  return user;
};

exports.updateMe = async (userId, { name, email, phone }, ctx = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: "User tidak ditemukan" };

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) throw { status: 409, message: "Email sudah digunakan" };
  }

  const oldValues = { name: user.name, email: user.email, phone: user.phone };
  await user.update({ name, email, phone });

  await auditLogService.log({
    userId,
    shopId: null,
    entityType: "user",
    entityId: userId,
    action: "update_profile",
    oldValues,
    newValues: { name, email, phone },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return await User.findByPk(userId, { attributes: SAFE_ATTRS });
};

exports.updatePhoto = async (userId, imageUrl, ctx = {}) => {
  const user = await User.findByPk(userId);
  if (!user) throw { status: 404, message: "User tidak ditemukan" };

  const oldValues = { image_url: user.image_url };
  await user.update({ image_url: imageUrl });

  await auditLogService.log({
    userId,
    shopId: null,
    entityType: "user",
    entityId: userId,
    action: "update_photo",
    oldValues,
    newValues: { image_url: imageUrl },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return { image_url: imageUrl };
};
