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

    // Migration 3: Add product_images columns
    await addImageFormatColumn(db, loggerUtil);
    await addIsThumbnailColumn(db, loggerUtil);

    // Migration 4: Create indexes
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
    // Ported to PostgreSQL
    const { rows: columns } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      AND column_name = 'is_active'
    `);

    if (columns.length > 0) {
      loggerUtil.debug('✓ Column is_active already exists');
      return;
    }

    // Add the column
    loggerUtil.info('  Adding is_active column to products table...');
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE
    `);

    loggerUtil.info('  ✅ Added is_active column');

  } catch (error) {
    loggerUtil.warn('Could not add is_active column:', error.message);
  }
}

/**
 * Add is_best_seller column if it doesn't exist
 */
async function addIsBestSellerColumn(db, loggerUtil) {
  try {
    const { rows: columns } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND table_schema = 'public'
      AND column_name = 'is_best_seller'
    `);

    if (columns.length > 0) {
      loggerUtil.debug('✓ Column is_best_seller already exists');
      return;
    }

    loggerUtil.info('  Adding is_best_seller column to products table...');
    await db.query(`
      ALTER TABLE products 
      ADD COLUMN is_best_seller BOOLEAN NOT NULL DEFAULT FALSE
    `);

    loggerUtil.info('  ✅ Added is_best_seller column');

  } catch (error) {
    loggerUtil.warn('Could not add is_best_seller column:', error.message);
  }
}

/**
 * Add image_format column to product_images if it doesn't exist
 */
async function addImageFormatColumn(db, loggerUtil) {
  try {
    const { rows: columns } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_images' 
      AND table_schema = 'public'
      AND column_name = 'image_format'
    `);

    if (columns.length > 0) {
      loggerUtil.debug('✓ Column image_format already exists');
      return;
    }

    loggerUtil.info('  Adding image_format column to product_images table...');
    await db.query(`
      ALTER TABLE product_images 
      ADD COLUMN image_format VARCHAR(50) DEFAULT 'jpg'
    `);

    loggerUtil.info('  ✅ Added image_format column');

  } catch (error) {
    loggerUtil.warn('Could not add image_format column:', error.message);
  }
}

/**
 * Add is_thumbnail column to product_images if it doesn't exist
 */
async function addIsThumbnailColumn(db, loggerUtil) {
  try {
    const { rows: columns } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'product_images' 
      AND table_schema = 'public'
      AND column_name = 'is_thumbnail'
    `);

    if (columns.length > 0) {
      loggerUtil.debug('✓ Column is_thumbnail already exists');
      return;
    }

    loggerUtil.info('  Adding is_thumbnail column to product_images table...');
    await db.query(`
      ALTER TABLE product_images 
      ADD COLUMN is_thumbnail BOOLEAN DEFAULT FALSE
    `);

    loggerUtil.info('  ✅ Added is_thumbnail column');

  } catch (error) {
    loggerUtil.warn('Could not add is_thumbnail column:', error.message);
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

    // Index 3: CRITICAL Performance index for joins
    await createIndexIfNotExists(
      db,
      loggerUtil,
      'idx_product_images_pid',
      'product_images',
      'product_id'
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
    // Ported to PostgreSQL
    const { rows: indexes } = await db.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = $1 
      AND indexname = $2
    `, [tableName, indexName]);

    if (indexes.length > 0) {
      loggerUtil.debug(`✓ Index ${indexName} already exists`);
      return;
    }

    // Create index
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    loggerUtil.info(`  Creating index ${indexName} on ${tableName}(${columnList})...`);

    // PostgreSQL uses double quotes or no quotes, NO backticks
    await db.query(`
      CREATE INDEX IF NOT EXISTS "${indexName}" 
      ON "${tableName}" (${Array.isArray(columns) ? columns.map(c => `"${c}"`).join(', ') : `"${columns}"`})
    `);

    loggerUtil.info(`  ✅ Created index ${indexName}`);

  } catch (error) {
    loggerUtil.warn(`  ⚠️ Could not create index ${indexName}:`, error.message);
  }
}

module.exports = {
  runStartupMigrations,
  addIsActiveColumn,
  addIsBestSellerColumn,
  addImageFormatColumn,
  addIsThumbnailColumn,
  createIndexes
};
