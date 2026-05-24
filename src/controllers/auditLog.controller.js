'use strict';

const auditLogService = require('../services/auditLog.service');
const { paginated, error } = require('../utils/response');

exports.list = async (req, res) => {
  try {
    const { data, meta } = await auditLogService.list(req.query, req.shopId, req.user.role);
    return paginated(res, data, meta, 'Daftar audit log berhasil diambil');
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
