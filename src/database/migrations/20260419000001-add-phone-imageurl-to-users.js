'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'phone', {
      type: Sequelize.STRING,
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'image_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'phone');
    await queryInterface.removeColumn('users', 'image_url');
  },
};
