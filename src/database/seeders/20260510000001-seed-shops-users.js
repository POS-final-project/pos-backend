"use strict";

const { getSyntheticSeedData } = require("./utils/synthetic-data");

module.exports = {
  async up(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkInsert("shops", data.shops);
    await queryInterface.bulkInsert("users", data.users);
    await queryInterface.bulkInsert("user_shops", data.userShops);
  },

  async down(queryInterface) {
    const data = getSyntheticSeedData();
    await queryInterface.bulkDelete("user_shops", {
      user_id: data.userShops.map((r) => r.user_id),
    });
    await queryInterface.bulkDelete("users", {
      id: data.users.map((r) => r.id),
    });
    await queryInterface.bulkDelete("shops", {
      id: data.shops.map((r) => r.id),
    });
  },
};
