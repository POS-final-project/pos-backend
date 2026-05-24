"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkInsert("inventory",       data.inventory);
    await queryInterface.bulkInsert("stock_movements", data.initialRestockMovements);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("stock_movements", { id: data.initialRestockMovements.map((r) => r.id) });
    await queryInterface.bulkDelete("inventory",       { id: data.inventory.map((r) => r.id) });
  },
};
