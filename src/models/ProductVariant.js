"use strict";

const { Model, DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  class ProductVariant extends Model {
    static associate(models) {
      ProductVariant.belongsTo(models.Product, { foreignKey: "product_id" });
      ProductVariant.hasMany(models.Inventory, {
        foreignKey: "product_variant_id",
      });
      ProductVariant.hasMany(models.StockMovement, {
        foreignKey: "product_variant_id",
      });
      ProductVariant.hasMany(models.TransactionItem, {
        foreignKey: "product_variant_id",
      });
      ProductVariant.hasMany(models.TransferItem, {
        foreignKey: "product_variant_id",
      });
    }
  }

  ProductVariant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      product_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      sku: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      barcode: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
      },
      image_url: {
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
      modelName: "ProductVariant",
      tableName: "product_variants",
      underscored: true,
    },
  );

  return ProductVariant;
};
