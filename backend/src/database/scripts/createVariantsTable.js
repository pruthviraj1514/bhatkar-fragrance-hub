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

async function createVariantsTable() {
  const connection = await pool.getConnection();
  try {
    console.log('🔄 Creating product_variants table...');

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS product_variants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        product_id INT NOT NULL,
        variant_name VARCHAR(255) NOT NULL COMMENT 'e.g., 50ml, 100ml, 250ml',
        variant_value INT NOT NULL COMMENT 'e.g., 50, 100, 250',
        variant_unit VARCHAR(10) NOT NULL DEFAULT 'ml' COMMENT 'ml, g, oz, etc',
        price DECIMAL(10, 2) NOT NULL COMMENT 'Variant-specific price',
        stock INT NOT NULL DEFAULT 0 COMMENT 'Variant-specific stock',
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        UNIQUE KEY unique_variant (product_id, variant_value, variant_unit),
        INDEX idx_product (product_id)
      )
    `;

    await connection.query(createTableSQL);
    console.log('✅ product_variants table created successfully');

    // Migrate existing products to variants
    console.log('\n🔄 Migrating existing products to variants...');

    const products = await connection.query('SELECT id, quantity_ml, quantity_unit, price, stock FROM products');

    for (const product of products[0]) {
      const variantName = `${product.quantity_ml}${product.quantity_unit}`;

      // Check if variant already exists
      const [existing] = await connection.query(
        'SELECT id FROM product_variants WHERE product_id = ? AND variant_value = ? AND variant_unit = ?',
        [product.id, product.quantity_ml, product.quantity_unit]
      );

      if (existing.length === 0) {
        // Create variant from product's main size
        await connection.query(
          `INSERT INTO product_variants (product_id, variant_name, variant_value, variant_unit, price, stock)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [product.id, variantName, product.quantity_ml, product.quantity_unit, product.price, product.stock]
        );
        console.log(`  ✓ Migrated product ${product.id}: ${variantName}`);
      }
    }

    console.log('\n✅ Migration complete');

  } catch (error) {
    console.error('❌ Error creating table:', error);
    process.exit(1);
  } finally {
    await connection.release();
    await pool.end();
  }
}

createVariantsTable();
