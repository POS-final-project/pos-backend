'use strict';

const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/users', require('./user.routes'));
router.use('/profile', require('./profile.routes'));
router.use('/shops', require('./shop.routes'));
router.use('/categories', require('./category.routes'));
router.use('/products', require('./product.routes'));
router.use('/inventory', require('./inventory.routes'));
router.use('/transfers', require('./transfer.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/transactions', require('./transaction.routes'));
router.use('/refunds', require('./refund.routes'));
router.use('/audit-logs', require('./auditLog.routes'));
router.use('/ai/sessions', require('./aiChat.routes'));
router.use('/dashboard',     require('./dashboard.routes'));
router.use('/notifications', require('./notification.routes'));

module.exports = router;
