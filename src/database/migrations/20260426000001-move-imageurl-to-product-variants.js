"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("product_variants", "image_url", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn("products", "image_url");
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("products", "image_url", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.removeColumn("product_variants", "image_url");
  },
};
