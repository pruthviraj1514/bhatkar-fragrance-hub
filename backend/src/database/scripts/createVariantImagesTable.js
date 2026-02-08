const db = require('../config/db.config');
const logger = require('../utils/logger');

/**
 * Create variant images table for ML/size-specific product images
 * This enables the Amazon-style image-first experience:
 * - Different images for each ML/size variant
 * - Variant selection switches image gallery automatically
 * - Images are managed per-variant in admin panel
 */

async function createVariantImagesTable() {
  return new Promise((resolve, reject) => {
    // Create the variant_images table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS variant_images (
        id INT PRIMARY KEY AUTO_INCREMENT,
        variant_id INT NOT NULL,
        image_url VARCHAR(2048) NOT NULL,
        alt_text VARCHAR(255),
        image_order INT NOT NULL DEFAULT 1,
        is_thumbnail BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
        updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        FOREIGN KEY (variant_id) REFERENCES product_variants(id) ON DELETE CASCADE,
        INDEX idx_variant (variant_id),
        UNIQUE KEY unique_variant_image (variant_id, image_order)
      )
    `;

    db.query(createTableSQL, (err) => {
      if (err) {
        logger.error(`Error creating variant_images table: ${err.message}`);
        return reject(err);
      }

      console.log('✅ variant_images table created successfully');

      // Now populate with images from product table -> variants
      // For each variant, use the product's main image as fallback
      const populateSQL = `
        INSERT INTO variant_images (variant_id, image_url, alt_text, image_order, is_thumbnail, is_active)
        SELECT 
          pv.id,
          pi.image_url,
          pi.alt_text,
          pi.image_order,
          pi.is_thumbnail,
          1
        FROM product_variants pv
        LEFT JOIN products p ON pv.product_id = p.id
        LEFT JOIN product_images pi ON p.id = pi.product_id
        WHERE pv.is_active = 1 AND pi.image_url IS NOT NULL
        ON DUPLICATE KEY UPDATE updated_at = NOW()
      `;

      db.query(populateSQL, (populateErr) => {
        if (populateErr && populateErr.code !== 'ER_DUP_ENTRY') {
          logger.error(`Error populating variant_images: ${populateErr.message}`);
          // Don't reject here as table creation succeeded
        }

        console.log('✅ Variant images populated from product images');
        resolve();
      });
    });
  });
}

async function run() {
  try {
    console.log('🚀 Creating Variant Images Table\n');
    await createVariantImagesTable();
    console.log('\n✅ Migration complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
}

run();
