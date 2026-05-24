'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasMany(models.UserShop, { foreignKey: 'user_id' });
      User.hasMany(models.Transaction, { foreignKey: 'user_id' });
      User.hasMany(models.StockMovement, { foreignKey: 'user_id' });
      User.hasMany(models.Refund, { foreignKey: 'user_id' });
      User.hasMany(models.AiChatSession, { foreignKey: 'user_id' });
      User.hasMany(models.Notification, { foreignKey: 'user_id' });
      User.hasMany(models.AuditLog, { foreignKey: 'user_id' });
      User.hasMany(models.Transfer, { foreignKey: 'requested_by', as: 'requestedTransfers' });
      User.hasMany(models.Transfer, { foreignKey: 'confirmed_by', as: 'confirmedTransfers' });
      User.belongsToMany(models.Shop, { through: models.UserShop, foreignKey: 'user_id' });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('superAdmin', 'admin', 'user'),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      underscored: true,
    }
  );

  return User;
};
