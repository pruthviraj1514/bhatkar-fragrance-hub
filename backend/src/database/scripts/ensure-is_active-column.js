/**
 * Safe migration: add `is_active` column to `products` if it doesn't exist
 * Run locally: node src/database/scripts/ensure-is_active-column.js (from backend folder)
 */
const db = require('../../config/db.pool');
const { logger } = require('../../utils/logger');

async function run() {
  const conn = await db.getConnection();
  try {
    // MySQL supports IF NOT EXISTS for ADD COLUMN in newer versions; use a safe check
    const [cols] = await conn.execute(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'is_active'`);
    if (cols && cols.length > 0) {
      console.log('✅ is_active column already exists on products');
      return;
    }

    console.log('🔄 Adding is_active column to products...');
    await conn.execute("ALTER TABLE products ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1");
    console.log('✅ Added is_active column');
  } catch (err) {
    logger.error('Failed to add is_active column:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

run();
