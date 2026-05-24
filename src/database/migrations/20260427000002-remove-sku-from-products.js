"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.removeColumn("products", "sku");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "sku", {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  },
};
