"use strict";

const { Op } = require("sequelize");
const {
  Product,
  ProductVariant,
  Category,
  Inventory,
  sequelize,
} = require("../models");
const { getPagination, getMeta } = require("../utils/pagination");
const auditLogService = require("./auditLog.service");

function toProductPayload(product) {
  const plain = product.toJSON();
  const variants = Array.isArray(plain.variants) ? [...plain.variants] : [];

  variants.sort((a, b) => {
    const left = String(a.sku || a.name || "");
    const right = String(b.sku || b.name || "");
    return left.localeCompare(right);
  });

  plain.variants = variants;

  const firstActiveVariant = variants.find(
    (variant) => variant.is_active !== false,
  );
  plain.image_url = firstActiveVariant
    ? firstActiveVariant.image_url || null
    : null;
  return plain;
}

// ─── Products ───────────────────────────────────────────────────────────────

exports.list = async (query) => {
  const { page, limit, offset } = getPagination(query);
  const where = {};

  if (query.search) where.name = { [Op.iLike]: `%${query.search}%` };
  if (query.categoryId) where.category_id = query.categoryId;
  if (query.isActive !== undefined) where.is_active = query.isActive === "true";

  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [
      { model: Category, attributes: ["id", "name"] },
      {
        model: ProductVariant,
        as: "variants",
        where: { is_active: true },
        required: false,
      },
    ],
    limit,
    offset,
    order: [
      ["name", "ASC"],
      [{ model: ProductVariant, as: "variants" }, "sku", "ASC"],
    ],
    distinct: true,
  });
  return {
    data: rows.map(toProductPayload),
    meta: getMeta(count, page, limit),
  };
};

exports.create = async ({ name, description, category_id, variants }, ctx = {}) => {
  const variantSkus = variants.map((v) => v.sku);
  const duplicateVariantSkus = variantSkus.filter(
    (s, i) => variantSkus.indexOf(s) !== i,
  );
  if (duplicateVariantSkus.length > 0)
    throw {
      status: 409,
      message: `SKU variant duplikat dalam request: ${duplicateVariantSkus.join(", ")}`,
    };

  const existingVariants = await ProductVariant.findAll({
    where: { sku: { [Op.in]: variantSkus } },
  });
  if (existingVariants.length > 0)
    throw {
      status: 409,
      message: `SKU variant sudah digunakan: ${existingVariants.map((v) => v.sku).join(", ")}`,
    };

  const result = await sequelize.transaction(async (t) => {
    const product = await Product.create(
      { name, description, category_id },
      { transaction: t },
    );

    await ProductVariant.bulkCreate(
      variants.map((v) => ({
        product_id: product.id,
        name: v.name,
        sku: v.sku,
        barcode: v.barcode || null,
        price: v.price,
        image_url: v.image_url || null,
      })),
      { transaction: t },
    );

    const created = await Product.findByPk(product.id, {
      include: [
        { model: Category, attributes: ["id", "name"] },
        { model: ProductVariant, as: "variants" },
      ],
      order: [[{ model: ProductVariant, as: "variants" }, "sku", "ASC"]],
      transaction: t,
    });

    if (!created)
      throw {
        status: 500,
        message: "Gagal memuat ulang produk setelah dibuat",
      };

    return toProductPayload(created);
  });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: "product",
    entityId: result.id,
    action: "create",
    newValues: result,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};

exports.detail = async (productId) => {
  const product = await Product.findByPk(productId, {
    include: [
      { model: Category, attributes: ["id", "name"] },
      { model: ProductVariant, as: "variants" },
    ],
    order: [[{ model: ProductVariant, as: "variants" }, "sku", "ASC"]],
  });
  if (!product) throw { status: 404, message: "Produk tidak ditemukan" };
  return toProductPayload(product);
};

exports.update = async (productId, body, ctx = {}) => {
  const product = await Product.findByPk(productId);
  if (!product) throw { status: 404, message: "Produk tidak ditemukan" };

  const oldValues = product.toJSON();
  const { name, description, category_id, is_active } = body;

  await product.update({ name, description, category_id, is_active });

  const updated = await Product.findByPk(productId, {
    include: [{ model: ProductVariant, as: "variants" }],
    order: [[{ model: ProductVariant, as: "variants" }, "sku", "ASC"]],
  });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: "product",
    entityId: productId,
    action: "update",
    oldValues,
    newValues: product.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return toProductPayload(updated);
};

exports.remove = async (productId, ctx = {}) => {
  const product = await Product.findByPk(productId);
  if (!product) throw { status: 404, message: "Produk tidak ditemukan" };

  const oldValues = product.toJSON();
  await product.update({ is_active: false });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: "product",
    entityId: productId,
    action: "delete",
    oldValues,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};

// ─── Variants ───────────────────────────────────────────────────────────────

exports.listVariants = async (productId, query) => {
  const product = await Product.findByPk(productId);
  if (!product) throw { status: 404, message: "Produk tidak ditemukan" };

  const { page, limit, offset } = getPagination(query);
  const { count, rows } = await ProductVariant.findAndCountAll({
    where: { product_id: productId },
    limit,
    offset,
    order: [["sku", "ASC"]],
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.createVariant = async (productId, { name, sku, barcode, price, image_url }, ctx = {}) => {
  const product = await Product.findByPk(productId);
  if (!product) throw { status: 404, message: "Produk tidak ditemukan" };

  const existing = await ProductVariant.findOne({ where: { sku } });
  if (existing) throw { status: 409, message: "SKU variant sudah digunakan" };

  if (barcode) {
    const barcodeExists = await ProductVariant.findOne({ where: { barcode } });
    if (barcodeExists) throw { status: 409, message: "Barcode sudah digunakan oleh variant lain" };
  }

  const variant = await ProductVariant.create({
    product_id: productId,
    name,
    sku,
    barcode: barcode || null,
    price,
    image_url,
  });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: "product_variant",
    entityId: variant.id,
    action: "create",
    newValues: variant.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return variant;
};

exports.detailVariant = async (productId, variantId) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, product_id: productId },
  });
  if (!variant) throw { status: 404, message: "Variant tidak ditemukan" };
  return variant;
};

exports.updateVariant = async (productId, variantId, body, ctx = {}) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, product_id: productId },
  });
  if (!variant) throw { status: 404, message: "Variant tidak ditemukan" };

  const { name, sku, barcode, price, image_url, is_active } = body;

  if (sku && sku !== variant.sku) {
    const existing = await ProductVariant.findOne({ where: { sku } });
    if (existing) throw { status: 409, message: "SKU variant sudah digunakan" };
  }

  if (barcode && barcode !== variant.barcode) {
    const barcodeExists = await ProductVariant.findOne({ where: { barcode } });
    if (barcodeExists) throw { status: 409, message: "Barcode sudah digunakan oleh variant lain" };
  }

  const oldValues = variant.toJSON();
  await variant.update({ name, sku, barcode: barcode ?? variant.barcode, price, image_url, is_active });

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: "product_variant",
    entityId: variantId,
    action: "update",
    oldValues,
    newValues: variant.toJSON(),
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return variant;
};

exports.getVariantByBarcode = async (barcode) => {
  const variant = await ProductVariant.findOne({
    where: { barcode, is_active: true },
    include: [{ model: Product, attributes: ['id', 'name'] }],
  });
  if (!variant) throw { status: 404, message: 'Produk dengan barcode tersebut tidak ditemukan' };
  return variant;
};

exports.deleteVariant = async (productId, variantId, ctx = {}) => {
  const variant = await ProductVariant.findOne({
    where: { id: variantId, product_id: productId },
  });
  if (!variant) throw { status: 404, message: "Variant tidak ditemukan" };

  const hasStock = await Inventory.findOne({
    where: { product_variant_id: variantId, stock: { [Op.gt]: 0 } },
  });
  if (hasStock)
    throw {
      status: 400,
      message: "Variant tidak bisa dihapus karena masih memiliki stok",
    };

  const oldValues = variant.toJSON();
  await variant.destroy();

  await auditLogService.log({
    userId: ctx.userId,
    shopId: ctx.shopId || null,
    entityType: "product_variant",
    entityId: variantId,
    action: "delete",
    oldValues,
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });
};
