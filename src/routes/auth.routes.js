'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/auth.controller');
const auth   = require('../middlewares/auth');
const authorize     = require('../middlewares/authorize');
const validate      = require('../middlewares/validate');
const { loginLimiter, forgotPasswordLimiter, resetPasswordLimiter } = require('../middlewares/rateLimiter');

router.post('/login',            loginLimiter,          validate.login,          ctrl.login);
router.post('/refresh',                                                           ctrl.refresh);
router.post('/logout',           auth,                                            ctrl.logout);
router.post('/register/admin',   auth, authorize('superAdmin'),                  validate.registerAdmin, ctrl.registerAdmin);
router.post('/register/user',    auth, authorize('superAdmin', 'admin'),         validate.registerUser,  ctrl.registerUser);
router.post('/forgot-password',  forgotPasswordLimiter, validate.forgotPassword, ctrl.forgotPassword);
router.post('/reset-password',   resetPasswordLimiter,  validate.resetPassword,  ctrl.resetPassword);
router.post('/change-password',  auth,                  validate.changePassword, ctrl.changePassword);

module.exports = router;
