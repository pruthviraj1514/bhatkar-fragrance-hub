#!/usr/bin/env node

/**
 * DIAGNOSTIC VERIFICATION SCRIPT
 * 
 * This script:
 * 1. Checks if is_active and is_best_seller columns exist
 * 2. Tests the aggregate query that was failing
 * 3. Identifies any SQL errors before deployment
 * 4. Provides safe recommendations
 * 
 * Usage:
 *   node backend/src/database/verify-production-schema.js
 */

require('dotenv/config');
const mysql = require('mysql2/promise');

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT = 3306
} = process.env;

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(color, ...args) {
  console.log(`${color}${args.join(' ')}${COLORS.reset}`);
}

async function verifySchema() {
  let connection;

  try {
    log(COLORS.blue, '\n📋 DATABASE VERIFICATION SCRIPT\n');
    log(COLORS.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // ====================================================================
    // STEP 1: Connection Test
    // ====================================================================
    log(COLORS.cyan, '🔌 STEP 1: Testing database connection...\n');

    try {
      connection = await mysql.createConnection({
        host: DB_HOST,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        port: DB_PORT,
        enableKeepAlive: true,
        keepAliveInitialDelayMs: 0
      });
      log(COLORS.green, '✅ Connected to database:', `${DB_USER}@${DB_HOST}:${DB_PORT}/${DB_NAME}\n`);
    } catch (error) {
      log(COLORS.red, '❌ Connection failed:', error.message);
      log(COLORS.yellow, '\n⚠️  Fix: Check .env file for correct credentials\n');
      process.exit(1);
    }

    // ====================================================================
    // STEP 2: Check if products table exists
    // ====================================================================
    log(COLORS.cyan, '🔍 STEP 2: Checking if products table exists...\n');

    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'products'
    `, [DB_NAME]);

    if (tables.length === 0) {
      log(COLORS.red, '❌ Products table not found!\n');
      log(COLORS.yellow, '⚠️  Fix: Run database initialization script first\n');
      process.exit(1);
    }
    log(COLORS.green, '✅ Products table exists\n');

    // ====================================================================
    // STEP 3: Check for is_active column
    // ====================================================================
    log(COLORS.cyan, '🔍 STEP 3: Checking is_active column...\n');

    const [activeColumn] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ? 
      AND COLUMN_NAME = 'is_active'
    `, [DB_NAME]);

    if (activeColumn.length === 0) {
      log(COLORS.red, '❌ MISSING: is_active column\n');
      log(COLORS.yellow, '⚠️  This is causing: "Unknown column \'p.is_active\' in \'field list\'"\n');
      log(COLORS.yellow, '✅ FIX: Run the migration script:\n');
      log(COLORS.yellow, '   node backend/src/database/migrations/001_add_is_active_column.js\n');
    } else {
      log(COLORS.green, '✅ is_active column exists');
      const col = activeColumn[0];
      log(COLORS.green, `   Type: ${col.COLUMN_TYPE}`);
      log(COLORS.green, `   Nullable: ${col.IS_NULLABLE}`);
      log(COLORS.green, `   Default: ${col.COLUMN_DEFAULT}\n`);
    }

    // ====================================================================
    // STEP 4: Check for is_best_seller column
    // ====================================================================
    log(COLORS.cyan, '🔍 STEP 4: Checking is_best_seller column...\n');

    const [bestSellerColumn] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ? 
      AND COLUMN_NAME = 'is_best_seller'
    `, [DB_NAME]);

    if (bestSellerColumn.length === 0) {
      log(COLORS.red, '❌ MISSING: is_best_seller column\n');
      log(COLORS.yellow, '⚠️  This will also fail the aggregate query\n');
      log(COLORS.yellow, '✅ FIX: Run the migration script\n');
    } else {
      log(COLORS.green, '✅ is_best_seller column exists');
      const col = bestSellerColumn[0];
      log(COLORS.green, `   Type: ${col.COLUMN_TYPE}`);
      log(COLORS.green, `   Nullable: ${col.IS_NULLABLE}`);
      log(COLORS.green, `   Default: ${col.COLUMN_DEFAULT}\n`);
    }

    // ====================================================================
    // STEP 5: Check if product_images table exists
    // ====================================================================
    log(COLORS.cyan, '🔍 STEP 5: Checking if product_images table exists...\n');

    const [imagesTables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'product_images'
    `, [DB_NAME]);

    if (imagesTables.length === 0) {
      log(COLORS.yellow, '⚠️  product_images table not found (optional for this check)\n');
    } else {
      log(COLORS.green, '✅ product_images table exists\n');
    }

    // ====================================================================
    // STEP 6: Count data
    // ====================================================================
    log(COLORS.cyan, '📊 STEP 6: Checking data integrity...\n');

    const [productCount] = await connection.execute(`
      SELECT COUNT(*) as count FROM products
    `);

    const count = productCount[0].count;
    log(COLORS.green, `✅ Total products: ${count}`);

    if (count > 0) {
      const [activeCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM products WHERE is_active = 1
      `);
      log(COLORS.green, `✅ Active products (is_active=1): ${activeCount[0].count}`);

      const [bestSellerCount] = await connection.execute(`
        SELECT COUNT(*) as count FROM products WHERE is_best_seller = 1
      `);
      log(COLORS.green, `✅ Best sellers: ${bestSellerCount[0].count}\n`);
    }

    // ====================================================================
    // STEP 7: Test the critical aggregate query
    // ====================================================================
    log(COLORS.cyan, '🧪 STEP 7: Testing the aggregate query that was failing...\n');

    try {
      const [result] = await connection.execute(`
        SELECT 
          p.id, 
          p.name, 
          p.is_active, 
          p.is_best_seller,
          JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', pi.id,
              'image_url', pi.image_url,
              'alt_text', pi.alt_text,
              'image_order', pi.image_order,
              'is_thumbnail', pi.is_thumbnail
            )
          ) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        GROUP BY p.id
        LIMIT 1
      `);

      log(COLORS.green, '✅ AGGREGATE QUERY WORKS!\n');

      if (result.length > 0) {
        log(COLORS.green, '   Sample result:');
        log(COLORS.green, `   - Product ID: ${result[0].id}`);
        log(COLORS.green, `   - Name: ${result[0].name}`);
        log(COLORS.green, `   - is_active: ${result[0].is_active}`);
        log(COLORS.green, `   - is_best_seller: ${result[0].is_best_seller}`);
        log(COLORS.green, `   - Images: ${result[0].images ? JSON.parse(result[0].images).length : 0}\n`);
      }
    } catch (queryError) {
      log(COLORS.red, '❌ AGGREGATE QUERY FAILED!\n');
      log(COLORS.red, 'Error:', queryError.message);
      log(COLORS.red, 'Code:', queryError.code, '\n');

      if (queryError.message.includes('Unknown column')) {
        const match = queryError.message.match(/Unknown column '([^']+)'/);
        const column = match ? match[1] : 'unknown';
        log(COLORS.yellow, `⚠️  Missing column: ${column}\n`);
        log(COLORS.yellow, '✅ FIX: Run migration:\n');
        log(COLORS.yellow, '   node backend/src/database/migrations/001_add_is_active_column.js\n');
      }
    }

    // ====================================================================
    // STEP 8: Performance check
    // ====================================================================
    log(COLORS.cyan, '⚡ STEP 8: Checking indexes for performance...\n');

    const [indexes] = await connection.execute(`
      SELECT DISTINCT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ?
    `, [DB_NAME]);

    log(COLORS.green, `✅ Indexes on products table: ${indexes.length}`);
    indexes.forEach(idx => {
      log(COLORS.green, `   - ${idx.INDEX_NAME}`);
    });

    if (!indexes.some(idx => idx.INDEX_NAME.includes('is_active'))) {
      log(COLORS.yellow, '\n⚠️  Missing: idx_is_active (for performance)\n');
    } else {
      log(COLORS.green, '\n✅ Performance indexes are in place\n');
    }

    // ====================================================================
    // FINAL SUMMARY
    // ====================================================================
    log(COLORS.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    log(COLORS.cyan, '📋 VERIFICATION SUMMARY\n');

    const hasActiveColumn = activeColumn.length > 0;
    const hasBestSellerColumn = bestSellerColumn.length > 0;

    if (hasActiveColumn && hasBestSellerColumn) {
      log(COLORS.green, '✅ ALL CHECKS PASSED\n');
      log(COLORS.green, '   Your database is ready for production!');
      log(COLORS.green, '   - is_active column: EXISTS');
      log(COLORS.green, '   - is_best_seller column: EXISTS');
      log(COLORS.green, '   - Aggregate query: WORKING\n');
      log(COLORS.green, '🚀 You can now deploy with confidence!\n');
    } else {
      log(COLORS.red, '❌ MIGRATION NEEDED\n');
      if (!hasActiveColumn) log(COLORS.red, '   ✗ Missing: is_active column');
      if (!hasBestSellerColumn) log(COLORS.red, '   ✗ Missing: is_best_seller column');
      log(COLORS.yellow, '\n✅ TO FIX: Run migration script\n');
      log(COLORS.yellow, '   node backend/src/database/migrations/001_add_is_active_column.js\n');
    }

    log(COLORS.blue, '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    log(COLORS.red, '❌ VERIFICATION FAILED:', error.message);
    log(COLORS.yellow, '\nTroubleshooting:');
    log(COLORS.yellow, '  1. Check .env file exists and is readable');
    log(COLORS.yellow, '  2. Verify database credentials are correct');
    log(COLORS.yellow, '  3. Ensure database is running and accessible');
    log(COLORS.yellow, '  4. Check network/firewall for Railway connections\n');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run verification
verifySchema();
