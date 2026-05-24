'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Shop extends Model {
    static associate(models) {
      Shop.hasMany(models.UserShop, { foreignKey: 'shop_id' });
      Shop.hasMany(models.Inventory, { foreignKey: 'shop_id' });
      Shop.hasMany(models.Transaction, { foreignKey: 'shop_id' });
      Shop.hasMany(models.StockMovement, { foreignKey: 'shop_id' });
      Shop.hasMany(models.AiChatSession, { foreignKey: 'shop_id' });
      Shop.hasMany(models.Notification, { foreignKey: 'shop_id' });
      Shop.hasMany(models.AuditLog, { foreignKey: 'shop_id' });
      Shop.belongsToMany(models.User, { through: models.UserShop, foreignKey: 'shop_id' });
      Shop.hasMany(models.Transfer, { foreignKey: 'from_shop_id', as: 'outgoingTransfers' });
      Shop.hasMany(models.Transfer, { foreignKey: 'to_shop_id', as: 'incomingTransfers' });
    }
  }

  Shop.init(
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
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Shop',
      tableName: 'shops',
      underscored: true,
    }
  );

  return Shop;
};
