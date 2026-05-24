'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/auditLog.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const shopAccess = require('../middlewares/shopAccess');

router.get('/', auth, authorize('superAdmin', 'admin'), shopAccess, ctrl.list);

module.exports = router;
