"use strict";

const { Op } = require("sequelize");
const {
  Inventory,
  StockMovement,
  ProductVariant,
  Product,
  Shop,
} = require("../models");
const { getPagination, getMeta } = require("../utils/pagination");
const auditLogService = require("./auditLog.service");

// ─── helpers ─────────────────────────────────────────────────────────────────

async function findOrCreateInventory(shop_id, product_variant_id, transaction) {
  const [inv] = await Inventory.findOrCreate({
    where: { shop_id, product_variant_id },
    defaults: { shop_id, product_variant_id, stock: 0, avg_cost_price: 0 },
    transaction,
  });
  return inv;
}

function calcNewAvgCost(currentStock, currentAvg, addQty, costPrice) {
  const total = currentStock + addQty;
  if (total === 0) return 0;
  return (
    (currentStock * parseFloat(currentAvg) + addQty * parseFloat(costPrice)) /
    total
  );
}

// ─── list ─────────────────────────────────────────────────────────────────────

exports.list = async (query, shopId) => {
  const { page, limit, offset } = getPagination(query);
  const where = shopId ? { shop_id: shopId } : {};

  const { count, rows } = await Inventory.findAndCountAll({
    where,
    include: [
      {
        model: ProductVariant,
        include: [{ model: Product, attributes: ["id", "name"] }],
      },
      { model: Shop, attributes: ["id", "name"] },
    ],
    limit,
    offset,
    order: [["updated_at", "DESC"]],
    distinct: true,
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};

exports.byProduct = async (productId, query, shopId) => {
  const { page, limit, offset } = getPagination(query);
  const variantWhere = { product_id: productId };
  const inventoryWhere = shopId ? { shop_id: shopId } : {};

  const { count, rows } = await Inventory.findAndCountAll({
    where: inventoryWhere,
    include: [
      {
        model: ProductVariant,
        where: variantWhere,
        include: [{ model: Product, attributes: ["id", "name"] }],
      },
      { model: Shop, attributes: ["id", "name"] },
    ],
    limit,
    offset,
    distinct: true,
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};

// ─── restock ──────────────────────────────────────────────────────────────────

exports.restock = async (
  { shop_id, product_variant_id, qty, cost_price, note },
  userId,
  ctx = {},
) => {
  const sequelize = Inventory.sequelize;
  const result = await sequelize.transaction(async (t) => {
    const inv = await findOrCreateInventory(shop_id, product_variant_id, t);

    const stockBefore = inv.stock;
    const avgBefore = parseFloat(inv.avg_cost_price);
    const newAvg = calcNewAvgCost(stockBefore, avgBefore, qty, cost_price || 0);
    const stockAfter = stockBefore + qty;

    await inv.update(
      { stock: stockAfter, avg_cost_price: newAvg },
      { transaction: t },
    );

    await StockMovement.create(
      {
        shop_id,
        user_id: userId,
        product_variant_id,
        type: "restock",
        qty,
        cost_price: cost_price || null,
        stock_before: stockBefore,
        stock_after: stockAfter,
        avg_cost_before: avgBefore,
        avg_cost_after: newAvg,
        note: note || null,
      },
      { transaction: t },
    );

    return inv.reload({ transaction: t });
  });

  await auditLogService.log({
    userId,
    shopId: shop_id,
    entityType: "inventory",
    entityId: result.id,
    action: "restock",
    newValues: { product_variant_id, qty, cost_price: cost_price || null, note: note || null },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};

// ─── adjustment out ───────────────────────────────────────────────────────────

exports.adjustOut = async (
  { shop_id, product_variant_id, qty, note },
  userId,
  ctx = {},
) => {
  const sequelize = Inventory.sequelize;
  const result = await sequelize.transaction(async (t) => {
    const inv = await Inventory.findOne({
      where: { shop_id, product_variant_id },
      transaction: t,
    });
    if (!inv) throw { status: 404, message: "Data inventory tidak ditemukan" };
    if (inv.stock < qty) throw { status: 400, message: "Stok tidak mencukupi" };

    const stockBefore = inv.stock;
    const avgCost = parseFloat(inv.avg_cost_price);
    const stockAfter = stockBefore - qty;

    await inv.update({ stock: stockAfter }, { transaction: t });

    await StockMovement.create(
      {
        shop_id,
        user_id: userId,
        product_variant_id,
        type: "adjustment",
        qty: -qty,
        stock_before: stockBefore,
        stock_after: stockAfter,
        avg_cost_before: avgCost,
        avg_cost_after: avgCost,
        note: note || null,
      },
      { transaction: t },
    );

    return inv.reload({ transaction: t });
  });

  await auditLogService.log({
    userId,
    shopId: shop_id,
    entityType: "inventory",
    entityId: result.id,
    action: "adjust_out",
    newValues: { product_variant_id, qty, note: note || null },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return result;
};

// ─── set threshold ────────────────────────────────────────────────────────────

exports.setThreshold = async (
  inventoryId,
  { low_stock_threshold },
  requesterId,
  requesterRole,
  ctx = {},
) => {
  const inv = await Inventory.findByPk(inventoryId);
  if (!inv) throw { status: 404, message: "Data inventory tidak ditemukan" };

  if (requesterRole !== "superAdmin") {
    const { UserShop } = require("../models");
    const assignment = await UserShop.findOne({
      where: { user_id: requesterId, shop_id: inv.shop_id },
    });
    if (!assignment)
      throw {
        status: 403,
        message: "Akses ke inventory toko ini tidak diizinkan",
      };
  }

  const oldValues = { low_stock_threshold: inv.low_stock_threshold };
  await inv.update({ low_stock_threshold });

  await auditLogService.log({
    userId: requesterId,
    shopId: inv.shop_id,
    entityType: "inventory",
    entityId: inventoryId,
    action: "set_threshold",
    oldValues,
    newValues: { low_stock_threshold },
    ipAddress: ctx.ip,
    userAgent: ctx.userAgent,
  });

  return inv;
};

// ─── movement history ─────────────────────────────────────────────────────────

exports.movementHistory = async (query, shopId) => {
  const { page, limit, offset } = getPagination(query);
  const where = shopId ? { shop_id: shopId } : {};
  if (query.type) where.type = query.type;

  const { count, rows } = await StockMovement.findAndCountAll({
    where,
    include: [
      {
        model: ProductVariant,
        attributes: ["id", "name", "sku"],
        include: [{ model: Product, attributes: ["id", "name"] }],
      },
      { model: Shop, attributes: ["id", "name"] },
    ],
    limit,
    offset,
    order: [["created_at", "DESC"]],
    distinct: true,
  });
  return { data: rows, meta: getMeta(count, page, limit) };
};
