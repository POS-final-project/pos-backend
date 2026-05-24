'use strict';

const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const auth = require('../middlewares/auth');
const authorize = require('../middlewares/authorize');

router.post('/login', ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', auth, ctrl.logout);
router.post('/register/admin', auth, authorize('superAdmin'), ctrl.registerAdmin);
router.post('/register/user', auth, authorize('superAdmin', 'admin'), ctrl.registerUser);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/reset-password', ctrl.resetPassword);
router.post('/change-password', auth, ctrl.changePassword);

module.exports = router;
