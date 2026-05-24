'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      shop_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'shops', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      entity_type: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      entity_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      action: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: 'create | update | delete | login | logout',
      },
      old_values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      new_values: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('audit_logs');
  },
};
