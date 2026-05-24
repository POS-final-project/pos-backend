'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AiChatSession extends Model {
    static associate(models) {
      AiChatSession.belongsTo(models.User, { foreignKey: 'user_id' });
      AiChatSession.belongsTo(models.Shop, { foreignKey: 'shop_id' });
      AiChatSession.hasMany(models.AiChatMessage, { foreignKey: 'session_id', as: 'messages' });
    }
  }

  AiChatSession.init(
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
      scope: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      shop_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      last_active_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deleted_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'AiChatSession',
      tableName: 'ai_chat_sessions',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      paranoid: true,
      deletedAt: 'deleted_at',
      underscored: true,
    }
  );

  return AiChatSession;
};
