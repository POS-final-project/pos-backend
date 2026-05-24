'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RefundItem extends Model {
    static associate(models) {
      RefundItem.belongsTo(models.Refund, { foreignKey: 'refund_id' });
      RefundItem.belongsTo(models.TransactionItem, { foreignKey: 'transaction_item_id' });
    }
  }

  RefundItem.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      refund_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      transaction_item_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'RefundItem',
      tableName: 'refund_items',
      timestamps: false,
      underscored: true,
    }
  );

  return RefundItem;
};
