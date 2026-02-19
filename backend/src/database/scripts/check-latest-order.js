#!/usr/bin/env node
require('dotenv').config();
const db = require('../../config/db.pool');

(async function() {
  try {
    const [rows] = await db.query('SELECT id, user_id, product_id, quantity, total_amount, razorpay_order_id, status, created_at FROM orders ORDER BY id DESC LIMIT 5');
    console.log('Latest orders:');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error querying orders:', err.message || err);
    process.exitCode = 1;
  } finally {
    try { await db.end(); } catch (e) {}
  }
})();
