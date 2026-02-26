/**
 * Database Migration - Razorpay Payment System
 * =============================================
 * 
 * Creates orders and payments tables required for Razorpay integration
 * 
 * Run with: node backend/src/database/scripts/setup-razorpay-tables.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function setupRazorpayTables() {
  let connection;
  try {
    // Quick debug: attempt a direct single connection first to capture low-level errors
    const debugCfg = {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME,
      port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
      connectTimeout: 10000,
    };
    console.log('DEBUG: attempting direct connection with config:', {
      host: debugCfg.host,
      user: debugCfg.user,
      database: debugCfg.database,
      port: debugCfg.port,
    });
    try {
      const testConn = await mysql.createConnection(debugCfg);
      await testConn.execute('SELECT 1');
      await testConn.end();
      console.log('DEBUG: direct connection OK');
    } catch (dErr) {
      console.error('DEBUG: direct connection failed:', dErr && dErr.stack ? dErr.stack : dErr);
    }

    connection = await pool.getConnection();
    console.log('✅ Connected to database');

    // ============================================
    // CREATE ORDERS TABLE
    // ============================================
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1 NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in INR',
        razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
        status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_user_id (user_id),
        INDEX idx_product_id (product_id),
        INDEX idx_razorpay_order_id (razorpay_order_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createOrdersTable);
    console.log('✅ Orders table created/exists');

    // ============================================
    // CREATE PAYMENTS TABLE
    // ============================================
    const createPaymentsTable = `
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL UNIQUE,
        razorpay_payment_id VARCHAR(100) NOT NULL UNIQUE,
        razorpay_signature VARCHAR(255) NOT NULL,
        payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
        gateway_response JSON COMMENT 'Razorpay API response',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_order_id (order_id),
        INDEX idx_razorpay_payment_id (razorpay_payment_id),
        INDEX idx_payment_status (payment_status),
        INDEX idx_created_at (created_at),
        
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `;

    await connection.execute(createPaymentsTable);
    console.log('✅ Payments table created/exists');

    // ============================================
    // VERIFY TABLES
    // ============================================
    const [ordersCols] = await connection.execute(`DESCRIBE orders`);
    const [paymentsCols] = await connection.execute(`DESCRIBE payments`);

    console.log('\n📊 ORDERS TABLE SCHEMA:');
    ordersCols.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n📊 PAYMENTS TABLE SCHEMA:');
    paymentsCols.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''}`);
    });

    console.log('\n✅ Database setup complete!');
    console.log('\n📝 READY FOR RAZORPAY INTEGRATION');
    console.log('   ✅ orders table ready');
    console.log('   ✅ payments table ready');
    console.log('   ✅ Foreign keys configured');
    console.log('   ✅ Indexes optimized');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    process.exit(1);
  } finally {
    if (connection) connection.release();
    await pool.end();
  }
}

setupRazorpayTables();
