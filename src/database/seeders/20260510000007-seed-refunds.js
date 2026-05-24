"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkInsert("refunds",         data.refunds);
    await queryInterface.bulkInsert("refund_items",    data.refundItems);
    await queryInterface.bulkInsert("stock_movements", data.refundMovements);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("stock_movements", { id: data.refundMovements.map((r) => r.id) });
    await queryInterface.bulkDelete("refund_items",    { id: data.refundItems.map((r) => r.id) });
    await queryInterface.bulkDelete("refunds",         { id: data.refunds.map((r) => r.id) });
  },
};
