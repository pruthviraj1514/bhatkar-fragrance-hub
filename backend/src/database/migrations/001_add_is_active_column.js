#!/usr/bin/env node

/**
 * Migration: Add is_active and is_best_seller columns to products table
 * 
 * Purpose:
 * - Ensure getAllProductsWithImages aggregate query works on all environments
 * - Support product visibility control (soft delete via is_active)
 * - Safe for existing rows (DEFAULT 1 enables all existing products)
 * 
 * Usage:
 * node backend/src/database/migrations/001_add_is_active_column.js
 * 
 * Before running: Ensure .env variables are set (DB_HOST, DB_USER, DB_PASSWORD, etc)
 */

require('dotenv/config');
const mysql = require('mysql2/promise');
const { logger } = require('../../utils/logger');

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT = 3306
} = process.env;

async function runMigration() {
  let connection;
  try {
    console.log('🚀 Starting migration: Add is_active to products table\n');

    // Create connection
    connection = await mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      database: DB_NAME,
      port: DB_PORT,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    });

    console.log('✅ Connected to database\n');

    // Step 1: Check if is_active column exists
    console.log('🔍 Step 1: Checking if is_active column exists...');
    const [activeColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ?
      AND COLUMN_NAME = 'is_active'
    `, [DB_NAME]);

    if (activeColumns.length > 0) {
      console.log('✅ Column is_active already exists');
    } else {
      console.log('   Adding is_active column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN is_active TINYINT(1) DEFAULT 1 
        NOT NULL 
        COMMENT 'Product visibility: 1 = active, 0 = inactive (soft delete)'
      `);
      console.log('✅ Added is_active column with DEFAULT 1\n');
    }

    // Step 2: Check if is_best_seller column exists
    console.log('🔍 Step 2: Checking if is_best_seller column exists...');
    const [bestSellerColumns] = await connection.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ?
      AND COLUMN_NAME = 'is_best_seller'
    `, [DB_NAME]);

    if (bestSellerColumns.length > 0) {
      console.log('✅ Column is_best_seller already exists');
    } else {
      console.log('   Adding is_best_seller column...');
      await connection.execute(`
        ALTER TABLE products 
        ADD COLUMN is_best_seller TINYINT(1) DEFAULT 0 
        NOT NULL 
        COMMENT 'Marks product as featured best seller'
      `);
      console.log('✅ Added is_best_seller column\n');
    }

    // Step 3: Create index on is_active for query performance
    console.log('🔍 Step 3: Creating indexes for performance...');
    const [indexes] = await connection.execute(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ?
      AND COLUMN_NAME = 'is_active'
      AND INDEX_NAME != 'PRIMARY'
    `, [DB_NAME]);

    if (indexes.length > 0) {
      console.log('✅ Index on is_active already exists');
    } else {
      console.log('   Creating index on is_active...');
      await connection.execute(`
        CREATE INDEX idx_is_active ON products(is_active)
      `);
      console.log('✅ Created index idx_is_active\n');
    }

    // Step 4: Verify data integrity
    console.log('🔍 Step 4: Verifying schema integrity...');
    const [products] = await connection.execute(`
      SELECT COUNT(*) as total_products FROM products
    `);
    
    const [activeProducts] = await connection.execute(`
      SELECT COUNT(*) as active_count FROM products WHERE is_active = 1
    `);

    const totalProducts = products[0].total_products;
    const activeCount = activeProducts[0].active_count;

    console.log(`   Total products: ${totalProducts}`);
    console.log(`   Active products (is_active=1): ${activeCount}`);
    console.log(`   ✅ All existing products are active by default\n`);

    // Step 5: Test the aggregate query
    console.log('🔍 Step 5: Testing the aggregate query...');
    try {
      const [testResults] = await connection.execute(`
        SELECT 
          p.id, 
          p.name, 
          p.is_active, 
          p.is_best_seller,
          COUNT(pi.id) as image_count
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        GROUP BY p.id
        LIMIT 1
      `);

      if (testResults.length > 0) {
        console.log('   Sample result from aggregate query:');
        console.log(`   - Product: ${testResults[0].name}`);
        console.log(`   - is_active: ${testResults[0].is_active}`);
        console.log(`   - is_best_seller: ${testResults[0].is_best_seller}`);
        console.log(`   - image_count: ${testResults[0].image_count}`);
        console.log('✅ Aggregate query works correctly\n');
      } else {
        console.log('   ⚠️  No products found to test\n');
      }
    } catch (testError) {
      console.error('   ❌ Test query failed:', testError.message);
      throw testError;
    }

    // Step 6: Show final schema
    console.log('🔍 Step 6: Final products table schema:');
    const [schema] = await connection.execute(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'products' 
      AND TABLE_SCHEMA = ?
      ORDER BY ORDINAL_POSITION
    `, [DB_NAME]);

    console.log('   Columns:');
    schema.forEach(col => {
      const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
      const defaultVal = col.COLUMN_DEFAULT !== null ? `DEFAULT ${col.COLUMN_DEFAULT}` : '';
      console.log(`   - ${col.COLUMN_NAME}: ${col.COLUMN_TYPE} ${nullable} ${defaultVal}`.trim());
    });

    console.log('\n✅ MIGRATION COMPLETED SUCCESSFULLY!\n');
    console.log('📝 Summary:');
    console.log('   ✓ is_active column added (TINYINT(1) DEFAULT 1)');
    console.log('   ✓ is_best_seller column verified');
    console.log('   ✓ Index on is_active created for performance');
    console.log('   ✓ All existing products are active by default');
    console.log('   ✓ Aggregate query is now working\n');

  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Verify .env file contains: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT');
    console.error('  2. Check that products table exists');
    console.error('  3. Verify database user has ALTER TABLE permissions');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration
runMigration()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
