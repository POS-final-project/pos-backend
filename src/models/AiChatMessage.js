'use strict';

const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class AiChatMessage extends Model {
    static associate(models) {
      AiChatMessage.belongsTo(models.AiChatSession, { foreignKey: 'session_id' });
    }
  }

  AiChatMessage.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      session_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      modelName: 'AiChatMessage',
      tableName: 'ai_chat_messages',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
    }
  );

  return AiChatMessage;
};
