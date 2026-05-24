'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/transfer.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');
const shopAccess = require('../middlewares/shopAccess');

router.post('/', auth, authorize('superAdmin', 'admin'), ctrl.create);
router.get('/outgoing', auth, authorize('superAdmin', 'admin'), shopAccess, ctrl.listOutgoing);
router.get('/incoming', auth, authorize('superAdmin', 'admin'), shopAccess, ctrl.listIncoming);
router.get('/:transferId', auth, authorize('superAdmin', 'admin'), ctrl.detail);
router.get('/:transferId/items', auth, authorize('superAdmin', 'admin'), ctrl.items);
router.patch('/:transferId/approve', auth, authorize('superAdmin', 'admin', 'user'), ctrl.approve);
router.patch('/:transferId/reject', auth, authorize('superAdmin', 'admin'), ctrl.reject);
router.patch('/:transferId/cancel', auth, authorize('superAdmin', 'admin'), ctrl.cancel);

module.exports = router;
