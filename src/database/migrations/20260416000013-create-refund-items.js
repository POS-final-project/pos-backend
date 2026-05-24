'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('refund_items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      refund_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'refunds', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      transaction_item_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'transaction_items', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      amount: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
      },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE refund_items
        ADD CONSTRAINT chk_refund_items_qty_gt_0 CHECK (qty > 0);
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('refund_items');
  },
};
