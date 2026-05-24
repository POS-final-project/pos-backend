'use strict';

const svc = require('../services/notification.service');
const { success, paginated, error } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const { data, meta } = await svc.list(req.user.id, req.query);
    return paginated(res, data, meta);
  } catch (err) {
    return error(res, err.message);
  }
};

exports.unreadCount = async (req, res) => {
  try {
    const count = await svc.unreadCount(req.user.id);
    return success(res, { count });
  } catch (err) {
    return error(res, err.message);
  }
};

exports.markRead = async (req, res) => {
  try {
    const notif = await svc.markRead(req.params.id, req.user.id);
    return success(res, notif);
  } catch (err) {
    return error(res, err.message || 'Server error', err.status ?? 500);
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await svc.markAllRead(req.user.id);
    return success(res, null, 'Semua notifikasi ditandai sudah dibaca');
  } catch (err) {
    return error(res, err.message);
  }
};
