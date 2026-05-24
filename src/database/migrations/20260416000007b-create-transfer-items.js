'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transfer_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      transfer_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'transfers', key: 'id' },
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
      note: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
    });

    await queryInterface.addIndex('transfer_items', ['transfer_id', 'product_variant_id'], {
      unique: true,
      name: 'uq_transfer_items_transfer_variant',
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE transfer_items
        ADD CONSTRAINT chk_transfer_items_qty_gt_0 CHECK (qty > 0);
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transfer_items');
  },
};
