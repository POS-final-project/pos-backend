"use strict";

const router = require("express").Router();
const ctrl = require("../controllers/profile.controller");
const auth = require("../middlewares/auth");
const { profileUpload } = require("../middlewares/upload");

router.get("/", auth, ctrl.getMe);
router.patch("/", auth, ctrl.updateMe);
router.patch("/photo", auth, profileUpload.single("photo"), ctrl.updatePhoto);

module.exports = router;
