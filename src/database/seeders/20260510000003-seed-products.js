"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();

    const products = data.productRows.map((p) => ({
      id:          p.id,
      category_id: p.category_id,
      name:        p.name,
      description: p.description,
      is_active:   true,
      created_at:  new Date("2026-03-01T07:00:00.000Z"),
      updated_at:  new Date("2026-03-01T07:00:00.000Z"),
    }));

    const variants = data.variantRows.map((v) => ({
      id:         v.id,
      product_id: v.product_id,
      name:       v.name,
      sku:        v.sku,
      barcode:    v.barcode   ?? null,
      price:      v.price,
      image_url:  v.image_url ?? null,
      is_active:  true,
      created_at: new Date("2026-03-01T07:00:00.000Z"),
      updated_at: new Date("2026-03-01T07:00:00.000Z"),
    }));

    await queryInterface.bulkInsert("products",         products);
    await queryInterface.bulkInsert("product_variants", variants);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("product_variants", { id: data.variantRows.map((v) => v.id) });
    await queryInterface.bulkDelete("products",         { id: data.productRows.map((p) => p.id) });
  },
};
