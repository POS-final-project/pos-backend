'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('transfers', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      from_shop_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      to_shop_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'shops', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      requested_by: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      confirmed_by: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'User yang approve/reject. Null jika masih pending atau cancelled oleh requester',
      },
      status: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending | approved | rejected | cancelled',
      },
      confirmed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Waktu saat status berubah dari pending ke approved/rejected/cancelled',
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
      ALTER TABLE transfers
        ADD CONSTRAINT chk_transfers_no_self_transfer
          CHECK (from_shop_id != to_shop_id),
        ADD CONSTRAINT chk_transfers_status_consistency
          CHECK (
            (status = 'pending'
              AND confirmed_at IS NULL) OR
            (status IN ('approved', 'rejected')
              AND confirmed_at IS NOT NULL
              AND confirmed_by IS NOT NULL) OR
            (status = 'cancelled'
              AND confirmed_at IS NOT NULL)
          );
    `);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('transfers');
  },
};
