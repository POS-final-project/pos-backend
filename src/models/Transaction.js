'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Transaction extends Model {
    static associate(models) {
      Transaction.belongsTo(models.Shop, { foreignKey: 'shop_id' });
      Transaction.belongsTo(models.User, { foreignKey: 'user_id' });
      Transaction.belongsTo(models.Customer, { foreignKey: 'customer_id' });
      Transaction.hasMany(models.TransactionItem, { foreignKey: 'transaction_id', as: 'items' });
      Transaction.hasMany(models.Refund, { foreignKey: 'transaction_id' });
      Transaction.hasMany(models.StockMovement, { foreignKey: 'transaction_id' });
    }
  }

  Transaction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      customer_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      invoice_no: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'Transaction',
      tableName: 'transactions',
      underscored: true,
    }
  );

  return Transaction;
};
