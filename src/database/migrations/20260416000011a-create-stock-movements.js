'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_movements', {
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
        onDelete: 'RESTRICT',
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      product_variant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'product_variants', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      transaction_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'transactions', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Diisi jika type = sale | refund',
      },
      transfer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'transfers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Diisi jika type = transfer_in | transfer_out',
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'sale | restock | transfer_in | transfer_out | adjustment | refund',
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Positif = stok masuk, Negatif = stok keluar',
      },
      cost_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        comment: 'Hanya diisi saat type = restock',
      },
      stock_before: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      stock_after: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      avg_cost_before: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      avg_cost_after: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE stock_movements
        ADD CONSTRAINT chk_stock_movements_ref CHECK (
          (type IN ('sale', 'refund')                    AND transaction_id IS NOT NULL) OR
          (type IN ('transfer_in', 'transfer_out')        AND transfer_id    IS NOT NULL) OR
          (type IN ('restock', 'adjustment'))
        );
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_movements');
  },
};
