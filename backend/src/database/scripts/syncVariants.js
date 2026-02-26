const db = require('../../config/db');
const logger = require('../utils/logger');

/**
 * Variant Sync Migration
 * Ensures all products have at least one variant with correct stock
 * Fixes zero-stock variants by syncing from product table
 */

async function syncVariants() {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, price, stock, quantity_ml, quantity_unit FROM products', async (err, products) => {
      if (err) {
        logger.error(`Error fetching products: ${err.message}`);
        return reject(err);
      }

      console.log(`🔄 Starting variant sync for ${products.length} products...\n`);
      let fixed = 0;
      let created = 0;

      for (const product of products) {
        try {
          // Check if product has any active variants
          db.query(
            'SELECT id, stock FROM product_variants WHERE product_id = ? AND is_active = 1',
            [product.id],
            (err, variants) => {
              if (err) {
                logger.error(`Error checking variants for product ${product.id}: ${err.message}`);
                return;
              }

              // If no variants exist, create one from product's base data
              if (!variants || variants.length === 0) {
                const variantName = `${product.quantity_ml || 100}${product.quantity_unit || 'ml'}`;
                const variantValue = product.quantity_ml || 100;
                const variantUnit = product.quantity_unit || 'ml';

                db.query(
                  `INSERT INTO product_variants 
                   (product_id, variant_name, variant_value, variant_unit, price, stock, is_active)
                   VALUES (?, ?, ?, ?, ?, ?, 1)`,
                  [product.id, variantName, variantValue, variantUnit, product.price || 0, product.stock || 0],
                  (insertErr) => {
                    if (insertErr) {
                      if (insertErr.code === 'ER_DUP_ENTRY') {
                        // Variant already exists, likely from earlier migration
                        logger.info(`✅ Variant already exists for product ${product.id}`);
                      } else {
                        logger.error(`Error creating variant for product ${product.id}: ${insertErr.message}`);
                      }
                    } else {
                      console.log(`✨ Created variant for product ${product.id} (stock: ${product.stock})`);
                      created++;
                    }
                  }
                );
              } else {
                // Variants exist - fix any with zero stock if product has stock
                if (product.stock > 0 && variants.some(v => v.stock === 0)) {
                  db.query(
                    'UPDATE product_variants SET stock = ? WHERE product_id = ? AND stock = 0',
                    [product.stock, product.id],
                    (updateErr) => {
                      if (!updateErr) {
                        console.log(`✅ Fixed zero-stock variant for product ${product.id} (updated to ${product.stock})`);
                        fixed++;
                      }
                    }
                  );
                } else {
                  console.log(`✔️ Product ${product.id} has valid variants`);
                }
              }
            }
          );
        } catch (err) {
          logger.error(`Sync failed for product ${product.id}: ${err.message}`);
        }
      }

      // Give database time to complete queries
      setTimeout(() => {
        console.log(`\n✅ Variant sync complete (created: ${created}, fixed: ${fixed})`);
        resolve({ created, fixed });
      }, 2000);
    });
  });
}

// Run the sync
console.log('🚀 Variant Sync Migration\n');
syncVariants()
  .then(() => {
    console.log('Migration successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
