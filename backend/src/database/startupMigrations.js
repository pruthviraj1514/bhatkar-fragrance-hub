/**
 * STARTUP MIGRATION UTILITY
 * 
 * This module can be imported and called on server startup
 * to automatically add missing columns without manual intervention.
 * 
 * Usage in backend/src/index.js:
 * 
 * const { runStartupMigrations } = require('./database/startupMigrations');
 * await runStartupMigrations(db, logger);  // Call after db connection
 */

const { logger } = require('../utils/logger');

/**
 * Run all startup migrations on server start
 * Safe to call multiple times - uses IF NOT EXISTS
 */
async function runStartupMigrations(db, loggerUtil = logger) {
  try {
    loggerUtil.info('🔄 Checking database schema...');

    // Migration 1: Add is_active column
    await addIsActiveColumn(db, loggerUtil);

    // Migration 2: Add is_best_seller column
    await addIsBestSellerColumn(db, loggerUtil);

    // Migration 3: Create indexes
    await createIndexes(db, loggerUtil);

    loggerUtil.info('✅ All startup migrations completed successfully');
    return { success: true, message: 'Migrations complete' };

  } catch (error) {
    loggerUtil.error('❌ Startup migration failed:', error.message);
    // Don't throw - allow server to start even if migration fails
    // (columns might already exist on production)
    return { success: false, message: error.message };
  }
}

/**
 * Add is_active column if it doesn't exist
 */
async function addIsActiveColumn(db, loggerUtil) {
  try {
    // First check if column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'is_active'
    `);

    if (columns.length > 0) {
      loggerUtil.debug('✓ Column is_active already exists');
      return;
    }

    // Add the column
    loggerUtil.info('  Adding is_active column to products table...');
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1 
      COMMENT 'Product visibility: 1=active, 0=inactive'
    `);

    loggerUtil.info('  ✅ Added is_active column');

  } catch (error) {
    // Ignore if column already exists (error code ER_DUP_FIELDNAME)
    if (error.code === 'ER_DUP_FIELDNAME' || error.code === 1060) {
      loggerUtil.debug('  ✓ Column is_active already exists (duplicate field error)');
      return;
    }
    throw error;
  }
}

/**
 * Add is_best_seller column if it doesn't exist
 */
async function addIsBestSellerColumn(db, loggerUtil) {
  try {
    // First check if column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'is_best_seller'
    `);

    if (columns.length > 0) {
      loggerUtil.debug('✓ Column is_best_seller already exists');
      return;
    }

    // Add the column
    loggerUtil.info('  Adding is_best_seller column to products table...');
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN is_best_seller TINYINT(1) NOT NULL DEFAULT 0 
      COMMENT 'Marks product as featured best seller'
    `);

    loggerUtil.info('  ✅ Added is_best_seller column');

  } catch (error) {
    // Ignore if column already exists
    if (error.code === 'ER_DUP_FIELDNAME' || error.code === 1060) {
      loggerUtil.debug('  ✓ Column is_best_seller already exists');
      return;
    }
    throw error;
  }
}

/**
 * Create indexes on products table for performance
 */
async function createIndexes(db, loggerUtil) {
  try {
    // Index 1: Single column index on is_active
    await createIndexIfNotExists(
      db,
      loggerUtil,
      'idx_is_active',
      'products',
      'is_active'
    );

    // Index 2: Composite index for common queries
    await createIndexIfNotExists(
      db,
      loggerUtil,
      'idx_is_active_created_on',
      'products',
      ['is_active', 'created_on']
    );

  } catch (error) {
    loggerUtil.warn('Could not create indexes:', error.message);
    // Don't throw - indexes are optional
  }
}

/**
 * Helper: Create index if it doesn't exist
 */
async function createIndexIfNotExists(db, loggerUtil, indexName, tableName, columns) {
  try {
    // Check if index exists
    const [indexes] = await db.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_NAME = ? 
      AND TABLE_SCHEMA = DATABASE()
      AND INDEX_NAME = ?
    `, [tableName, indexName]);

    if (indexes.length > 0) {
      loggerUtil.debug(`✓ Index ${indexName} already exists`);
      return;
    }

    // Create index
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    loggerUtil.debug(`  Creating index ${indexName} on ${tableName}(${columnList})...`);

    await db.query(`
      CREATE INDEX \`${indexName}\` 
      ON \`${tableName}\` (\`${columnList.replace(/,\s*/g, '`, `')}\`)
    `);

    loggerUtil.debug(`  ✅ Created index ${indexName}`);

  } catch (error) {
    // Ignore if index already exists or other non-critical errors
    if (error.message.includes('Duplicate')) {
      loggerUtil.debug(`  ✓ Index ${indexName} already exists`);
      return;
    }
    throw error;
  }
}

module.exports = {
  runStartupMigrations,
  addIsActiveColumn,
  addIsBestSellerColumn,
  createIndexes
};
