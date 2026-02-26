const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function diagnoseVariants() {
  const connection = await pool.getConnection();
  try {
    console.log('🔍 Diagnosing variant data...\n');

    // Check products table
    const [products] = await connection.query(
      'SELECT id, name, price, stock, quantity_ml, quantity_unit FROM products LIMIT 5'
    );
    console.log('📦 Sample Products:');
    console.table(products);

    // Check variants for each product
    for (const product of products) {
      const [variants] = await connection.query(
        'SELECT id, variant_name, variant_value, variant_unit, price, stock FROM product_variants WHERE product_id = ?',
        [product.id]
      );
      console.log(`\n🔹 Variants for Product ID ${product.id} (${product.name}):`);
      if (variants.length === 0) {
        console.log('  ⚠️ No variants found');
      } else {
        console.table(variants);
      }
    }

    console.log('\n✅ Diagnostic complete');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.release();
    await pool.end();
  }
}

diagnoseVariants();
