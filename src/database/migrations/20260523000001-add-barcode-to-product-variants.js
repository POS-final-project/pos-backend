'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('product_variants', 'barcode', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
      after: 'sku',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('product_variants', 'barcode');
  },
};
