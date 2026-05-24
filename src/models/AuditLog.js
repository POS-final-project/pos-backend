'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AuditLog extends Model {
    static associate(models) {
      AuditLog.belongsTo(models.User, { foreignKey: 'user_id' });
      AuditLog.belongsTo(models.Shop, { foreignKey: 'shop_id' });
    }
  }

  AuditLog.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      entity_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      old_values: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      new_values: {
        type: DataTypes.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AuditLog',
      tableName: 'audit_logs',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
    }
  );

  return AuditLog;
};
