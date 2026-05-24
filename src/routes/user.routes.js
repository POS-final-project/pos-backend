'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

router.get('/', auth, authorize('superAdmin'), ctrl.list);
router.get('/:userId', auth, authorize('superAdmin'), ctrl.detail);
router.patch('/:userId', auth, authorize('superAdmin'), ctrl.update);

module.exports = router;
