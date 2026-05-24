'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class TransactionItem extends Model {
    static associate(models) {
      TransactionItem.belongsTo(models.Transaction, { foreignKey: 'transaction_id' });
      TransactionItem.belongsTo(models.ProductVariant, { foreignKey: 'product_variant_id' });
      TransactionItem.hasMany(models.RefundItem, { foreignKey: 'transaction_item_id' });
    }
  }

  TransactionItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      transaction_id: {
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
      price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
      cost_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'TransactionItem',
      tableName: 'transaction_items',
      timestamps: false,
      underscored: true,
    }
  );

  return TransactionItem;
};
