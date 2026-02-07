const app = require('./app');
const { logger } = require('./utils/logger');
const db = require('./config/db.config');

const PORT = process.env.PORT || 3000;

// Run migrations before starting the server
async function runMigrations() {
    try {
        // Check if quantity_ml column exists
        const checkColumnsQuery = `
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME IN ('quantity_ml', 'quantity_unit')
        `;
        
        const [existingColumns] = await db.query(checkColumnsQuery);
        
        if (existingColumns.length === 2) {
            logger.info('✓ Database schema is up to date');
        } else {
            // Add missing columns
            if (!existingColumns.find(col => col.COLUMN_NAME === 'quantity_ml')) {
                logger.info('🔄 Adding quantity_ml column...');
                await db.query(`ALTER TABLE products ADD COLUMN quantity_ml INT DEFAULT 100 AFTER price`);
                logger.info('✓ Added quantity_ml column');
            }

            if (!existingColumns.find(col => col.COLUMN_NAME === 'quantity_unit')) {
                logger.info('🔄 Adding quantity_unit column...');
                await db.query(`ALTER TABLE products ADD COLUMN quantity_unit VARCHAR(10) DEFAULT 'ml' AFTER quantity_ml`);
                logger.info('✓ Added quantity_unit column');
            }
        }

        // Check and create product_variants table if it doesn't exist
        const checkVariantsQuery = `
            SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_variants'
        `;
        
        const [existingVariantsTable] = await db.query(checkVariantsQuery);
        
        if (existingVariantsTable.length === 0) {
            logger.info('🔄 Creating product_variants table...');
            const createVariantsTableSQL = `
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
            await db.query(createVariantsTableSQL);
            logger.info('✓ Created product_variants table');

            // Migrate existing products to variants
            logger.info('🔄 Migrating existing products to variants...');
            const [products] = await db.query('SELECT id, quantity_ml, quantity_unit, price, stock FROM products');
            
            for (const product of products) {
                const variantName = `${product.quantity_ml}${product.quantity_unit}`;
                
                // Check if variant already exists
                const [existing] = await db.query(
                    'SELECT id FROM product_variants WHERE product_id = ? AND variant_value = ? AND variant_unit = ?',
                    [product.id, product.quantity_ml, product.quantity_unit]
                );

                if (existing.length === 0) {
                    // Create variant from product's main size
                    await db.query(
                        `INSERT INTO product_variants (product_id, variant_name, variant_value, variant_unit, price, stock)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [product.id, variantName, product.quantity_ml, product.quantity_unit, product.price, product.stock]
                    );
                }
            }

            logger.info('✓ Successfully migrated products to variants');
        } else {
            logger.info('✓ product_variants table already exists');
        }

    } catch (error) {
        logger.warn(`Migration check failed: ${error.message}. This may be normal if the database is not ready yet.`);
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`Running on PORT ${PORT}`);
    // Run migrations after server starts
    await runMigrations();
});
