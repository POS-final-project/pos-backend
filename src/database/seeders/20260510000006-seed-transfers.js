"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkInsert("transfers",       data.transfers);
    await queryInterface.bulkInsert("transfer_items",  data.transferItems);
    await queryInterface.bulkInsert("stock_movements", data.transferMovements);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("stock_movements", { id: data.transferMovements.map((r) => r.id) });
    await queryInterface.bulkDelete("transfer_items",  { id: data.transferItems.map((r) => r.id) });
    await queryInterface.bulkDelete("transfers",       { id: data.transfers.map((r) => r.id) });
  },
};
