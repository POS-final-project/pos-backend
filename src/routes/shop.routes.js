'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/shop.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

router.get('/', auth, authorize('superAdmin', 'admin', 'user'), ctrl.list);
router.post('/', auth, authorize('superAdmin'), ctrl.create);
router.get('/:shopId', auth, authorize('superAdmin', 'admin', 'user'), ctrl.detail);
router.patch('/:shopId', auth, authorize('superAdmin', 'admin'), ctrl.update);
router.delete('/:shopId', auth, authorize('superAdmin'), ctrl.remove);

router.get('/:shopId/staff', auth, authorize('superAdmin', 'admin'), ctrl.listStaff);
router.post('/:shopId/staff', auth, authorize('superAdmin', 'admin'), ctrl.assignStaff);
router.delete('/:shopId/staff/:userId', auth, authorize('superAdmin', 'admin'), ctrl.removeStaff);

module.exports = router;
