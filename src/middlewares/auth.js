'use strict';

const { verifyAccess } = require('../utils/jwt');
const { error } = require('../utils/response');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Unauthorized', 401);
  }
  try {
    req.user = verifyAccess(authHeader.slice(7));
    next();
  } catch {
    return error(res, 'Token invalid atau expired', 401);
  }
};
