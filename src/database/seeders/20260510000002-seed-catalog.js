"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkInsert("categories", data.categoryRows);
    await queryInterface.bulkInsert("customers",  data.customers);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("customers",  { id: data.customers.map((r) => r.id) });
    await queryInterface.bulkDelete("categories", { id: data.categoryRows.map((r) => r.id) });
  },
};
