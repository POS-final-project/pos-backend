'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/transaction.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const shopAccess = require('../middlewares/shopAccess');

router.get('/', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.list);
router.post('/', auth, authorize('superAdmin', 'admin', 'user'), ctrl.create);
router.get('/:transactionId/receipt', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.receipt);
router.get('/:transactionId', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.detail);
router.patch('/:transactionId/cancel', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.cancel);

module.exports = router;
