'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Refund extends Model {
    static associate(models) {
      Refund.belongsTo(models.User, { foreignKey: 'user_id' });
      Refund.belongsTo(models.Transaction, { foreignKey: 'transaction_id' });
      Refund.hasMany(models.RefundItem, { foreignKey: 'refund_id', as: 'items' });
    }
  }

  Refund.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      transaction_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'Refund',
      tableName: 'refunds',
      underscored: true,
    }
  );

  return Refund;
};
