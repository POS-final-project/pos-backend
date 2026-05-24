'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Transfer extends Model {
    static associate(models) {
      Transfer.belongsTo(models.Shop, { foreignKey: 'from_shop_id', as: 'fromShop' });
      Transfer.belongsTo(models.Shop, { foreignKey: 'to_shop_id', as: 'toShop' });
      Transfer.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requester' });
      Transfer.belongsTo(models.User, { foreignKey: 'confirmed_by', as: 'confirmer' });
      Transfer.hasMany(models.TransferItem, { foreignKey: 'transfer_id', as: 'items' });
      Transfer.hasMany(models.StockMovement, { foreignKey: 'transfer_id' });
    }
  }

  Transfer.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      from_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      to_shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      requested_by: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      confirmed_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'pending',
      },
      confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Transfer',
      tableName: 'transfers',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return Transfer;
};
