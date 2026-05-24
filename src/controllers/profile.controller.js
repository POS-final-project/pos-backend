"use strict";

const profileService = require("../services/profile.service");
const { success, error } = require("../utils/response");

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers["user-agent"],
});

exports.getMe = async (req, res) => {
  try {
    const data = await profileService.getMe(req.user.id);
    return success(res, data, "Profil berhasil diambil");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.updateMe = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const data = await profileService.updateMe(req.user.id, { name, email, phone }, makeCtx(req));
    return success(res, data, "Profil berhasil diperbarui");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.updatePhoto = async (req, res) => {
  try {
    if (!req.file) return error(res, "File gambar wajib diunggah", 400);
    const data = await profileService.updatePhoto(
      req.user.id,
      `/uploads/profile/${req.file.filename}`,
      makeCtx(req),
    );
    return success(res, data, "Foto profil berhasil diperbarui");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
