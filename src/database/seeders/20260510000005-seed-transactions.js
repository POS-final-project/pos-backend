"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkInsert("transactions",      data.transactions);
    await queryInterface.bulkInsert("transaction_items", data.transactionItems);
    await queryInterface.bulkInsert("stock_movements",   data.saleMovements);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("stock_movements",   { id: data.saleMovements.map((r) => r.id) });
    await queryInterface.bulkDelete("transaction_items", { id: data.transactionItems.map((r) => r.id) });
    await queryInterface.bulkDelete("transactions",      { id: data.transactions.map((r) => r.id) });
  },
};
