'use strict';

const { UserShop } = require('../models');
const { error } = require('../utils/response');

/**
 * Resolves req.shopId for shop_or_global scoped endpoints.
 *
 * superAdmin: req.shopId = query.shopId or null (no filter = see all)
 * admin/user:
 *   - If shopId provided in query → validate ownership → set req.shopId
 *   - If not provided → auto-infer from their user_shops (requires exactly one)
 */
module.exports = async (req, res, next) => {
  try {
    const { role, id: userId } = req.user;

    if (role === 'superAdmin') {
      req.shopId = req.query.shopId || null;
      return next();
    }

    const shopId = req.query.shopId;

    if (shopId) {
      const assignment = await UserShop.findOne({ where: { user_id: userId, shop_id: shopId } });
      if (!assignment) return error(res, 'Akses ke toko ini tidak diizinkan', 403);
      req.shopId = shopId;
      return next();
    }

    // Auto-infer from user_shops
    const assignments = await UserShop.findAll({ where: { user_id: userId } });
    if (assignments.length === 0) return error(res, 'Anda belum ditugaskan ke toko manapun', 403);
    if (assignments.length > 1) return error(res, 'Anda memiliki beberapa toko, sertakan shopId di query', 400);

    req.shopId = assignments[0].shop_id;
    next();
  } catch (err) {
    return error(res, err.message || 'Server error', 500);
  }
};
