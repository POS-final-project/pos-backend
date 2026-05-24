'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transaction_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'Snapshot harga jual saat transaksi',
      },
      cost_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Snapshot avg_cost_price dari inventory saat transaksi',
      },
      subtotal: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        comment: 'price * qty',
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transaction_items');
  },
};
