'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      shop_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      product_variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reserved_stock: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Stok yang sedang dalam proses transfer keluar. Stok tersedia = stock - reserved_stock',
      },
      avg_cost_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      low_stock_threshold: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.addIndex('inventory', ['shop_id', 'product_variant_id'], {
      unique: true,
      name: 'uq_inventory_shop_variant',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE inventory
        ADD CONSTRAINT chk_inventory_stock_gte_0 CHECK (stock >= 0),
        ADD CONSTRAINT chk_inventory_reserved_gte_0 CHECK (reserved_stock >= 0),
        ADD CONSTRAINT chk_inventory_reserved_lte_stock CHECK (reserved_stock <= stock),
        ADD CONSTRAINT chk_inventory_low_stock_threshold_gte_0 CHECK (low_stock_threshold >= 0);
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('inventory');
  },
};
