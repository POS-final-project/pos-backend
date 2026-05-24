'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/inventory.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const shopAccess = require('../middlewares/shopAccess');

router.get('/', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.list);
router.get('/movements', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.movementHistory);
router.get('/products/:productId', auth, authorize('superAdmin', 'admin', 'user'), shopAccess, ctrl.byProduct);
router.post('/restock', auth, authorize('superAdmin', 'admin'), ctrl.restock);
router.post('/adjustment-out', auth, authorize('superAdmin', 'admin'), ctrl.adjustOut);
router.patch('/:inventoryId/threshold', auth, authorize('superAdmin', 'admin'), ctrl.setThreshold);

module.exports = router;
