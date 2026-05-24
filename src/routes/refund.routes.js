'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/refund.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const shopAccess = require('../middlewares/shopAccess');

router.get('/', auth, authorize('superAdmin', 'admin'), shopAccess, ctrl.list);
router.post('/', auth, authorize('superAdmin', 'admin', 'user'), ctrl.create);
router.get('/:refundId', auth, authorize('superAdmin', 'admin'), shopAccess, ctrl.detail);

module.exports = router;
