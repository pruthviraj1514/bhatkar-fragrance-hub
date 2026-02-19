#!/usr/bin/env node
require('dotenv').config();
const pool = require('../../config/db.pool');

async function columnExists(table, column) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?',
    [table, column]
  );
  return rows[0] && rows[0].cnt > 0;
}

async function addColumnIfMissing(table, columnDef) {
  const [column, definition] = columnDef;
  const exists = await columnExists(table, column);
  if (exists) {
    console.log(`${column} already exists on ${table}`);
    return false;
  }
  console.log(`Adding ${column} to ${table}...`);
  await pool.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`Added ${column} to ${table}`);
  return true;
}

async function main() {
  try {
    // Columns required by paymentService.createOrder
    const toAdd = [
      ['product_id', 'INT NOT NULL'],
      ['quantity', 'INT NOT NULL DEFAULT 1'],
      ['total_amount', 'DECIMAL(12,2) NOT NULL DEFAULT 0'],
      ['razorpay_order_id', "VARCHAR(128) NULL"],
      ['status', "VARCHAR(50) NULL"],
      ['created_at', "DATETIME NULL" ]
    ];

    for (const col of toAdd) {
      await addColumnIfMissing('orders', col);
    }

    console.log('✅ ensure-orders-columns migration complete.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    try { await pool.end(); } catch (e) {}
  }
}

main();
