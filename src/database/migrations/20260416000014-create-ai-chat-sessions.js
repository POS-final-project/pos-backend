'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ai_chat_sessions', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      scope: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'global | shop',
      },
      shop_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'shops', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      last_active_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Soft delete — diisi saat user clear sesi',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('ai_chat_sessions');
  },
};
