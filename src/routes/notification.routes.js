'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/notification.controller');
const auth   = require('../middlewares/auth');

router.get('/',             auth, ctrl.list);
router.get('/unread-count', auth, ctrl.unreadCount);
router.patch('/read-all',   auth, ctrl.markAllRead);
router.patch('/:id/read',   auth, ctrl.markRead);

module.exports = router;
