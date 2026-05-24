'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/category.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

router.get('/', auth, ctrl.list);
router.post('/', auth, authorize('superAdmin'), ctrl.create);
router.patch('/:categoryId', auth, authorize('superAdmin'), ctrl.update);
router.delete('/:categoryId', auth, authorize('superAdmin'), ctrl.remove);

module.exports = router;
