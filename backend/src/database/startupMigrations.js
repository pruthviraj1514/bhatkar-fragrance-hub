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

    // Migration 4: Add users table columns
    await addUsersTableColumns(db, loggerUtil);

    // Migration 5: Create indexes
    await createIndexes(db, loggerUtil);

    // Migration 6: Fix is_active NULL values and set default
    await fixIsActiveDefault(db, loggerUtil);

    // Migration 7: Create order_items table and fix orders table for multi-item orders
    await createOrderItemsTable(db, loggerUtil);
    await fixOrdersTableForMultiItemOrders(db, loggerUtil);

    // Migration 8: Add Shiprocket shipping fields to orders table
    await addShippingFields(db, loggerUtil);

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
 * Add missing columns to users table
 */
async function addUsersTableColumns(db, loggerUtil) {
  const columnsToAdd = [
    { name: 'name', type: 'VARCHAR(100)' },
    { name: 'full_name', type: 'VARCHAR(100)' },
    { name: 'phone', type: 'VARCHAR(20)' },
    { name: 'role', type: "VARCHAR(20) DEFAULT 'customer'" },
    { name: 'is_verified', type: 'BOOLEAN DEFAULT FALSE' }
  ];

  for (const col of columnsToAdd) {
    try {
      const { rows: columns } = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND table_schema = 'public'
        AND column_name = $1
      `, [col.name]);

      if (columns.length === 0) {
        loggerUtil.info(`  Adding ${col.name} column to users table...`);
        await db.query(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
        loggerUtil.info(`  ✅ Added ${col.name} column`);
      }
    } catch (err) {
      loggerUtil.warn(`  ⚠️ Could not add column ${col.name} to users table:`, err.message);
    }
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

/**
 * Fix is_active column: set default to true and update NULLs
 */
async function fixIsActiveDefault(db, loggerUtil) {
  try {
    loggerUtil.info('  Ensuring is_active defaults to true and fixing NULLs...');

    // 1. Update existing NULLs to true
    const updateResult = await db.query(`
      UPDATE products 
      SET is_active = TRUE 
      WHERE is_active IS NULL
    `);
    if (updateResult.rowCount > 0) {
      loggerUtil.info(`  ✅ Updated ${updateResult.rowCount} products with NULL is_active to TRUE`);
    }

    // 2. Ensure the column default is TRUE in PostgreSQL
    await db.query(`
      ALTER TABLE products 
      ALTER COLUMN is_active SET DEFAULT TRUE
    `);

    loggerUtil.info('  ✅ is_active default set to TRUE');

  } catch (error) {
    loggerUtil.warn('  ⚠️ Could not fix is_active defaults:', error.message);
  }
}

/**
 * Create order_items table for multi-item orders
 */
async function createOrderItemsTable(db, loggerUtil) {
  try {
    // Check if order_items table exists
    const { rows: tables } = await db.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'order_items'
    `);

    if (tables.length > 0) {
      loggerUtil.debug('✓ order_items table already exists');
      return;
    }

    loggerUtil.info('  Creating order_items table...');
    // PostgreSQL syntax - no INDEX in CREATE TABLE
    await db.query(`
      CREATE TABLE order_items (
        id SERIAL PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        subtotal DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      )
    `);

    // Create indexes separately (PostgreSQL way)
    await db.query('CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id)');
    await db.query('CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id)');

    loggerUtil.info('  ✅ Created order_items table with indexes');

  } catch (error) {
    loggerUtil.warn('  ⚠️ Could not create order_items table:', error.message);
  }
}

/**
 * Make product_id and quantity nullable in orders table
 */
async function fixOrdersTableForMultiItemOrders(db, loggerUtil) {
  try {
    // Check if product_id is already nullable
    const { rows: columns } = await db.query(`
      SELECT is_nullable FROM information_schema.columns 
      WHERE table_name = 'orders' 
      AND table_schema = 'public'
      AND column_name = 'product_id'
    `);

    if (columns.length > 0 && columns[0].is_nullable === 'YES') {
      loggerUtil.debug('✓ product_id is already nullable');
      return;
    }

    loggerUtil.info('  Making product_id and quantity nullable in orders table...');
    
    // Drop foreign key if exists
    try {
      await db.query(`
        ALTER TABLE orders 
        DROP CONSTRAINT orders_product_id_fkey
      `);
    } catch (e) {
      loggerUtil.debug('  No existing foreign key constraint');
    }

    // Make columns nullable
    await db.query(`
      ALTER TABLE orders 
      ALTER COLUMN product_id DROP NOT NULL,
      ALTER COLUMN quantity DROP NOT NULL
    `);

    // Re-add foreign key as optional
    try {
      await db.query(`
        ALTER TABLE orders 
        ADD CONSTRAINT orders_product_id_fkey 
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      `);
    } catch (e) {
      loggerUtil.debug('  Could not add foreign key back');
    }

    loggerUtil.info('  ✅ Fixed orders table for multi-item support');

  } catch (error) {
    loggerUtil.warn('  ⚠️ Could not fix orders table:', error.message);
  }
}

/**
 * Add shipping fields to orders table for Shiprocket integration
 */
async function addShippingFields(db, loggerUtil) {
  const shippingColumns = [
    { name: 'phone', type: 'VARCHAR(20)' },
    { name: 'first_name', type: 'VARCHAR(100)' },
    { name: 'last_name', type: 'VARCHAR(100)' },
    { name: 'shipping_address', type: 'TEXT' },
    { name: 'shipping_city', type: 'VARCHAR(100)' },
    { name: 'shipping_pincode', type: 'VARCHAR(10)' },
    { name: 'shipping_state', type: 'VARCHAR(100)' },
    { name: 'shipping_phone', type: 'VARCHAR(20)' },
    { name: 'shiprocket_order_id', type: 'VARCHAR(255)' },
    { name: 'awb_code', type: 'VARCHAR(255)' },
    { name: 'courier_name', type: 'VARCHAR(255)' },
    { name: 'tracking_url', type: 'TEXT' },
    { name: 'shipment_status', type: 'VARCHAR(100)' }
  ];

  try {
    for (const col of shippingColumns) {
      const { rows: columns } = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'orders' 
        AND table_schema = 'public'
        AND column_name = $1
      `, [col.name]);

      if (columns.length === 0) {
        loggerUtil.info(`  Adding ${col.name} column to orders table...`);
        await db.query(`ALTER TABLE orders ADD COLUMN ${col.name} ${col.type}`);
        loggerUtil.info(`  ✅ Added ${col.name} column`);
      }
    }

  } catch (error) {
    loggerUtil.warn('  ⚠️ Could not add shipping fields to orders table:', error.message);
  }
}

module.exports = {
  runStartupMigrations,
  addIsActiveColumn,
  addIsBestSellerColumn,
  addImageFormatColumn,
  addIsThumbnailColumn,
  addUsersTableColumns,
  createIndexes,
  createOrderItemsTable,
  fixOrdersTableForMultiItemOrders,
  addShippingFields
};
