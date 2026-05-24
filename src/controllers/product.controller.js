"use strict";

const productService = require("../services/product.service");
const { success, paginated, error } = require("../utils/response");

const makeCtx = (req) => ({
  userId: req.user?.id,
  shopId: req.shopId || null,
  ip: req.ip,
  userAgent: req.headers["user-agent"],
});

function toVariantImageUrl(filename) {
  return `/uploads/product-variant/${filename}`;
}

function parseVariantsFromBody(body) {
  if (Array.isArray(body.variants)) return body.variants;

  if (typeof body.variants === "string") {
    try {
      const parsed = JSON.parse(body.variants);
      if (Array.isArray(parsed)) return parsed;
    } catch (_err) {
      // Fallback ke format bracket notation multipart.
    }
  }

  const byIndex = {};
  Object.entries(body).forEach(([key, value]) => {
    const match = key.match(/^variants\[(\d+)\]\[(.+)\]$/);
    if (!match) return;

    const index = Number(match[1]);
    const field = match[2];
    if (!Number.isInteger(index)) return;

    if (!byIndex[index]) byIndex[index] = {};
    byIndex[index][field] = value;
  });

  const indexes = Object.keys(byIndex)
    .map((k) => Number(k))
    .sort((a, b) => a - b);
  return indexes.map((i) => byIndex[i]);
}

function mapVariantImagesFromFiles(variants, files) {
  if (!Array.isArray(variants) || variants.length === 0) return variants;
  if (!Array.isArray(files) || files.length === 0) return variants;

  const sequentialFiles = [];

  files.forEach((file) => {
    const fieldName = String(file.fieldname || "");
    const indexedMatch = fieldName.match(
      /^variants\[(\d+)\]\[(image|image_url)\]$/,
    );

    if (indexedMatch) {
      const index = Number(indexedMatch[1]);
      if (variants[index])
        variants[index].image_url = toVariantImageUrl(file.filename);
      return;
    }

    if (
      fieldName === "variant_images" ||
      fieldName === "variant_image" ||
      fieldName === "images" ||
      fieldName === "image"
    ) {
      sequentialFiles.push(file);
    }
  });

  let pointer = 0;
  variants.forEach((variant) => {
    if (variant.image_url) return;
    if (pointer >= sequentialFiles.length) return;
    variant.image_url = toVariantImageUrl(sequentialFiles[pointer].filename);
    pointer += 1;
  });

  return variants;
}

// ─── Products ────────────────────────────────────────────────────────────────

exports.list = async (req, res) => {
  try {
    const { data, meta } = await productService.list(req.query);
    return paginated(res, data, meta, "Daftar produk berhasil diambil");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, category_id } = req.body;
    let variants = parseVariantsFromBody(req.body);
    variants = mapVariantImagesFromFiles(variants, req.files);

    if (!name) return error(res, "name wajib diisi", 400);

    if (!Array.isArray(variants) || variants.length === 0)
      return error(res, "minimal 1 variant wajib disertakan", 400);

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      if (!v.name || !v.sku || v.price === undefined)
        return error(
          res,
          `variant[${i}]: name, sku, dan price wajib diisi`,
          400,
        );
    }

    const data = await productService.create(
      { name, description, category_id, variants },
      makeCtx(req),
    );
    return success(res, data, "Produk berhasil dibuat", 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detail = async (req, res) => {
  try {
    const data = await productService.detail(req.params.productId);
    return success(res, data, "Detail produk berhasil diambil");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.update = async (req, res) => {
  try {
    const data = await productService.update(req.params.productId, req.body, makeCtx(req));
    return success(res, data, "Produk berhasil diperbarui");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.remove = async (req, res) => {
  try {
    await productService.remove(req.params.productId, makeCtx(req));
    return success(res, null, "Produk berhasil dihapus");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

// ─── Variants ────────────────────────────────────────────────────────────────

exports.listVariants = async (req, res) => {
  try {
    const { data, meta } = await productService.listVariants(
      req.params.productId,
      req.query,
    );
    return paginated(res, data, meta, "Daftar variant berhasil diambil");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.createVariant = async (req, res) => {
  try {
    const { name, sku, barcode, price, image_url } = req.body;
    const variantImageUrl = req.file
      ? toVariantImageUrl(req.file.filename)
      : image_url;
    if (!name || !sku || price === undefined)
      return error(res, "name, sku, dan price wajib diisi", 400);
    const data = await productService.createVariant(
      req.params.productId,
      { name, sku, barcode: barcode || null, price, image_url: variantImageUrl },
      makeCtx(req),
    );
    return success(res, data, "Variant berhasil dibuat", 201);
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.getVariantByBarcode = async (req, res) => {
  try {
    const data = await productService.getVariantByBarcode(req.params.code);
    return success(res, data, "Variant ditemukan");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.detailVariant = async (req, res) => {
  try {
    const data = await productService.detailVariant(
      req.params.productId,
      req.params.variantId,
    );
    return success(res, data, "Detail variant berhasil diambil");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.updateVariant = async (req, res) => {
  try {
    const body = {
      ...req.body,
      image_url: req.file
        ? toVariantImageUrl(req.file.filename)
        : req.body.image_url,
    };

    const data = await productService.updateVariant(
      req.params.productId,
      req.params.variantId,
      body,
      makeCtx(req),
    );
    return success(res, data, "Variant berhasil diperbarui");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};

exports.deleteVariant = async (req, res) => {
  try {
    await productService.deleteVariant(
      req.params.productId,
      req.params.variantId,
      makeCtx(req),
    );
    return success(res, null, "Variant berhasil dihapus");
  } catch (err) {
    return error(res, err.message, err.status || 500);
  }
};
