'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class StockMovement extends Model {
    static associate(models) {
      StockMovement.belongsTo(models.Shop, { foreignKey: 'shop_id' });
      StockMovement.belongsTo(models.User, { foreignKey: 'user_id' });
      StockMovement.belongsTo(models.ProductVariant, { foreignKey: 'product_variant_id' });
      StockMovement.belongsTo(models.Transaction, { foreignKey: 'transaction_id' });
      StockMovement.belongsTo(models.Transfer, { foreignKey: 'transfer_id' });
    }
  }

  StockMovement.init(
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
      product_variant_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      transaction_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      transfer_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      qty: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      cost_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      stock_before: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      stock_after: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      avg_cost_before: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      avg_cost_after: {
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
      modelName: 'StockMovement',
      tableName: 'stock_movements',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
    }
  );

  return StockMovement;
};
