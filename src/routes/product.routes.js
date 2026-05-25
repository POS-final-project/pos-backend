"use strict";

const router = require("express").Router();
const ctrl = require("../controllers/product.controller");
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const { productVariantUpload } = require("../middlewares/upload");

// ─── Barcode lookup (harus di atas /:productId) ──────────────────────────────
router.get("/variants/by-barcode/:code", auth, ctrl.getVariantByBarcode);

// ─── Products ────────────────────────────────────────────────────────────────
router.get("/", auth, ctrl.list);
router.post(
  "/",
  auth,
  authorize("superAdmin", "admin"),
  productVariantUpload.any(),
  ctrl.create,
);
router.get("/:productId", auth, ctrl.detail);
router.patch(
  "/:productId",
  auth,
  authorize("superAdmin", "admin"),
  ctrl.update,
);
router.delete(
  "/:productId",
  auth,
  authorize("superAdmin", "admin"),
  ctrl.remove,
);

// ─── Variants (nested) ───────────────────────────────────────────────────────
router.get("/:productId/variants", auth, ctrl.listVariants);
router.post(
  "/:productId/variants",
  auth,
  authorize("superAdmin", "admin"),
  productVariantUpload.single("image"),
  ctrl.createVariant,
);
router.get("/:productId/variants/:variantId", auth, ctrl.detailVariant);
router.patch(
  "/:productId/variants/:variantId",
  auth,
  authorize("superAdmin", "admin"),
  productVariantUpload.single("image"),
  ctrl.updateVariant,
);
router.delete(
  "/:productId/variants/:variantId",
  auth,
  authorize("superAdmin", "admin"),
  ctrl.deleteVariant,
);

module.exports = router;
