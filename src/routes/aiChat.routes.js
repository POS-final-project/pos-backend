'use strict';

const router = require('express').Router();
const ctrl   = require('../controllers/aiChat.controller');
const auth   = require('../middlewares/auth');

router.post('/',                 auth, ctrl.createSession);
router.get('/',                  auth, ctrl.listSessions);
router.get('/:sessionId',        auth, ctrl.getSession);
router.delete('/:sessionId',     auth, ctrl.deleteSession);
router.post('/:sessionId/chat',  auth, ctrl.chat);

module.exports = router;
