'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/customer.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

router.get('/', auth, authorize('superAdmin', 'admin', 'user'), ctrl.list);
router.post('/', auth, authorize('superAdmin', 'admin', 'user'), ctrl.create);
router.get('/:customerId', auth, authorize('superAdmin', 'admin', 'user'), ctrl.detail);
router.patch('/:customerId', auth, authorize('superAdmin', 'admin'), ctrl.update);
router.delete('/:customerId', auth, authorize('superAdmin', 'admin'), ctrl.remove);
router.get('/:customerId/transactions', auth, authorize('superAdmin', 'admin'), ctrl.transactions);

module.exports = router;
