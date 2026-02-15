/**
 * RAZORPAY PAYMENT SCHEMA MIGRATION
 * ==================================
 * Safe migration script with error handling
 * Creates all tables if they don't exist
 * 
 * Usage: Run once during deployment
 * npm run migrate:razorpay
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Initialize database pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'shinkansen.proxy.rlwy.net',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'railway',
  port: process.env.DB_PORT || 11735,
  waitForConnections: true,
  connectionLimit: 5,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 0,
});

const migrations = {
  // ===== TABLE 1: ORDERS =====
  orders: `
    CREATE TABLE IF NOT EXISTS orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT UNSIGNED NULL,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      total_amount DECIMAL(10, 2) NOT NULL,
      razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,
      status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') DEFAULT 'PENDING',
      items_count INT DEFAULT 0,
      shipping_address TEXT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY idx_user_id (user_id),
      KEY idx_razorpay_order_id (razorpay_order_id),
      KEY idx_order_number (order_number),
      KEY idx_status (status),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ===== TABLE 2: PAYMENTS =====
  payments: `
    CREATE TABLE IF NOT EXISTS payments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT UNSIGNED NOT NULL,
      razorpay_payment_id VARCHAR(255) UNIQUE NOT NULL,
      razorpay_signature VARCHAR(255) NULL,
      payment_status ENUM('PENDING', 'AUTHORIZED', 'SUCCESS', 'FAILED', 'ERROR') DEFAULT 'PENDING',
      payment_method VARCHAR(50) NULL,
      amount DECIMAL(10, 2) NOT NULL,
      error_code VARCHAR(100) NULL,
      error_message TEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_payment_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE CASCADE,
      KEY idx_order_id (order_id),
      KEY idx_razorpay_payment_id (razorpay_payment_id),
      KEY idx_payment_status (payment_status),
      KEY idx_created_at (created_at),
      KEY idx_order_status (order_id, payment_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ===== TABLE 3: REFUNDS =====
  refunds: `
    CREATE TABLE IF NOT EXISTS refunds (
      id INT PRIMARY KEY AUTO_INCREMENT,
      payment_id INT UNSIGNED NOT NULL,
      razorpay_refund_id VARCHAR(255) UNIQUE NOT NULL,
      refund_amount DECIMAL(10, 2) NOT NULL,
      refund_status ENUM('INITIATED', 'PROCESSED', 'FAILED', 'REVERSED') DEFAULT 'INITIATED',
      refund_reason VARCHAR(255) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id)
        REFERENCES payments(id) ON DELETE CASCADE,
      KEY idx_payment_id (payment_id),
      KEY idx_razorpay_refund_id (razorpay_refund_id),
      KEY idx_refund_status (refund_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,

  // ===== TABLE 4: PAYMENT LOGS =====
  payment_logs: `
    CREATE TABLE IF NOT EXISTS payment_logs (
      id INT PRIMARY KEY AUTO_INCREMENT,
      order_id INT UNSIGNED NULL,
      payment_id INT UNSIGNED NULL,
      log_type ENUM('API_CALL', 'WEBHOOK', 'ERROR', 'VERIFICATION') DEFAULT 'API_CALL',
      action VARCHAR(100) NOT NULL,
      request_data JSON NULL,
      response_data JSON NULL,
      status_code INT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_log_order FOREIGN KEY (order_id)
        REFERENCES orders(id) ON DELETE SET NULL,
      CONSTRAINT fk_log_payment FOREIGN KEY (payment_id)
        REFERENCES payments(id) ON DELETE SET NULL,
      KEY idx_order_id (order_id),
      KEY idx_payment_id (payment_id),
      KEY idx_log_type (log_type),
      KEY idx_action (action),
      KEY idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `,
};

/**
 * Run migrations
 */
async function runMigrations() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🔄 Starting Razorpay schema migration...\n');
    
    for (const [tableName, sql] of Object.entries(migrations)) {
      try {
        await connection.execute(sql);
        console.log(`✅ Table '${tableName}' created/verified`);
      } catch (error) {
        console.error(`❌ Error creating '${tableName}':`, error.message);
        throw error;
      }
    }

    console.log('\n✅ All tables created successfully!');
    console.log('\n📊 Tables created:');
    console.log('   • orders (customer orders)');
    console.log('   • payments (payment transactions)');
    console.log('   • refunds (refund requests)');
    console.log('   • payment_logs (audit trail)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.release();
    }
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = { migrations, runMigrations };
