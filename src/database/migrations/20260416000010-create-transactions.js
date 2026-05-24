'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transactions', {
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
      customer_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'customers', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      invoice_no: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'selesai | refunded',
      },
      payment_method: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'cash | qris',
      },
      paid_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Null jika status refunded',
      },
      subtotal: {
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
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });

    await queryInterface.sequelize.query(`
      ALTER TABLE transactions
        ADD CONSTRAINT chk_transactions_paid_at_consistency
          CHECK (
            (status = 'selesai' AND paid_at IS NOT NULL) OR
            (status != 'selesai')
          );
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transactions');
  },
};
