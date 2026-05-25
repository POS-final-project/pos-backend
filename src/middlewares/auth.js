'use strict';

const { verifyAccess } = require('../utils/jwt');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized', 401);
  }
  try {
    const payload = verifyAccess(authHeader.slice(7));
    if (payload.purpose) return error(res, 'Token tidak valid untuk autentikasi', 401);
    req.user = payload;
    next();
  } catch {
    return error(res, 'Token invalid atau expired', 401);
  }
};
