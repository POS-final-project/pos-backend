'use strict';

const router     = require('express').Router();
const ctrl       = require('../controllers/dashboard.controller');
const auth       = require('../middlewares/auth');
const authorize  = require('../middlewares/authorize');
const shopAccess = require('../middlewares/shopAccess');

router.get(
  '/summary',
  auth,
  authorize('superAdmin', 'admin'),
  shopAccess,
  ctrl.summary,
);

module.exports = router;
