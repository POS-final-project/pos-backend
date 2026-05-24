'use strict';

module.exports = {
  async up(queryInterface) {
    // 1. Drop ai_insights table (migration file was removed)
    await queryInterface.sequelize.query(`
      DROP TABLE IF EXISTS ai_insights;
    `);

    // 2. Remove SequelizeMeta record so undo:all won't look for the deleted file
    await queryInterface.sequelize.query(`
      DELETE FROM "SequelizeMeta" WHERE name = '20260416000016-create-ai-insights.js';
    `);

    // 3. Fix check constraint on transactions (completed → selesai)
    await queryInterface.sequelize.query(`
      ALTER TABLE transactions
        DROP CONSTRAINT IF EXISTS chk_transactions_paid_at_consistency;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE transactions
        ADD CONSTRAINT chk_transactions_paid_at_consistency
          CHECK (
            (status = 'selesai' AND paid_at IS NOT NULL) OR
            (status != 'selesai')
          );
    `);

    // 4. Migrate existing data to new values
    await queryInterface.sequelize.query(`
      UPDATE transactions SET status = 'selesai'   WHERE status = 'completed';
      UPDATE transactions SET status = 'refunded'  WHERE status IN ('cancelled', 'pending');
      UPDATE transactions SET payment_method = 'cash' WHERE payment_method IN ('transfer', 'credit');
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE transactions
        DROP CONSTRAINT IF EXISTS chk_transactions_paid_at_consistency;
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE transactions
        ADD CONSTRAINT chk_transactions_paid_at_consistency
          CHECK (
            (status = 'completed' AND paid_at IS NOT NULL) OR
            (status != 'completed')
          );
    `);

    await queryInterface.createTable('ai_insights', {
      id:            { type: Sequelize.UUID, primaryKey: true, defaultValue: Sequelize.literal('gen_random_uuid()') },
      shop_id:       { type: Sequelize.UUID, allowNull: true, references: { model: 'shops', key: 'id' }, onDelete: 'SET NULL' },
      period_type:   { type: Sequelize.STRING, allowNull: false },
      period_start:  { type: Sequelize.DATE, allowNull: false },
      period_end:    { type: Sequelize.DATE, allowNull: false },
      summary:       { type: Sequelize.TEXT },
      recommendations: { type: Sequelize.JSONB },
      anomalies:     { type: Sequelize.JSONB },
      generated_at:  { type: Sequelize.DATE, defaultValue: Sequelize.literal('NOW()') },
      created_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
      updated_at:    { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('NOW()') },
    });
  },
};
