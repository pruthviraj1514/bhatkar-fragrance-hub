/**
 * Migration: Fix Multi-Item Orders
 * ================================
 * - Make product_id and quantity nullable in orders table
 * - Create order_items junction table for multiple products per order
 */

const db = require('../../config/db');
const { logger } = require('../../utils/logger');

async function up() {
  const conn = await db.getConnection();
  try {
    console.log('🔄 Running migration: Fix Multi-Item Orders...');

    // 1. Alter orders table to make product_id nullable
    console.log('📝 Making product_id and quantity nullable in orders table...');
    await conn.query(`
      ALTER TABLE orders 
      MODIFY product_id INT NULL,
      MODIFY quantity INT DEFAULT NULL
    `);

    // 2. Create order_items table
    console.log('📝 Creating order_items table...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2) NOT NULL COMMENT 'Price per unit at time of order',
        subtotal DECIMAL(10, 2) NOT NULL COMMENT 'quantity * price',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        -- Indexes
        INDEX idx_order_id (order_id),
        INDEX idx_product_id (product_id),
        
        -- Foreign keys
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    console.log('✅ Migration completed successfully!');
    return true;
  } catch (error) {
    logger.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    conn.release();
  }
}

async function down() {
  const conn = await db.getConnection();
  try {
    console.log('🔄 Rolling back migration...');
    
    // Drop order_items table
    await conn.query('DROP TABLE IF EXISTS order_items');
    
    console.log('✅ Rollback completed');
    return true;
  } catch (error) {
    logger.error('❌ Rollback failed:', error.message);
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { up, down };
