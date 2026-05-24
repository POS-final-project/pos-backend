"use strict";

const multer = require("multer");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function createStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, "..", "..", "uploads", subDir);
      fs.mkdirSync(uploadDir, { recursive: true });
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const unique = crypto.randomBytes(12).toString("hex");
      cb(null, `${unique}${path.extname(file.originalname)}`);
    },
  });
}

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (jpeg, png, webp) yang diizinkan"), false);
  }
};

function createUpload(subDir) {
  return multer({
    storage: createStorage(subDir),
    fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
  });
}

const profileUpload = createUpload("profile");
const productVariantUpload = createUpload("product-variant");

module.exports = {
  createUpload,
  profileUpload,
  productVariantUpload,
};
