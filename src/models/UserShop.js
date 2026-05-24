'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class UserShop extends Model {
    static associate(models) {
      UserShop.belongsTo(models.User, { foreignKey: 'user_id' });
      UserShop.belongsTo(models.Shop, { foreignKey: 'shop_id' });
    }
  }

  UserShop.init(
    {
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
        primaryKey: true,
      },
    },
    {
      sequelize,
      modelName: 'UserShop',
      tableName: 'user_shops',
      timestamps: false,
      underscored: true,
    }
  );

  return UserShop;
};
