'use strict';

const { error } = require('../utils/response');

module.exports = (...roles) =>
  (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return error(res, 'Forbidden: insufficient role', 403);
    }
    next();
  };
