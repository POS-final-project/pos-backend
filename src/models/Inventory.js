'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Inventory extends Model {
    static associate(models) {
      Inventory.belongsTo(models.Shop, { foreignKey: 'shop_id' });
      Inventory.belongsTo(models.ProductVariant, { foreignKey: 'product_variant_id' });
    }
  }

  Inventory.init(
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
      product_variant_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      reserved_stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      avg_cost_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      low_stock_threshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
      },
    },
    {
      sequelize,
      modelName: 'Inventory',
      tableName: 'inventory',
      timestamps: true,
      createdAt: false,
      updatedAt: 'updated_at',
      underscored: true,
    }
  );

  return Inventory;
};
