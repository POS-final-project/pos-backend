'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TransferItem extends Model {
    static associate(models) {
      TransferItem.belongsTo(models.Transfer, { foreignKey: 'transfer_id' });
      TransferItem.belongsTo(models.ProductVariant, { foreignKey: 'product_variant_id' });
    }
  }

  TransferItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      transfer_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      product_variant_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'TransferItem',
      tableName: 'transfer_items',
      timestamps: false,
      underscored: true,
    }
  );

  return TransferItem;
};
