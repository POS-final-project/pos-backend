'use strict';

const svc = require('../services/dashboard.service');
const { success, error } = require('../utils/response');

exports.summary = async (req, res) => {
  try {
    const data = await svc.getSummary(req.shopId ?? null);
    return success(res, data, 'Dashboard summary');
  } catch (err) {
    return error(res, err.message);
  }
};
