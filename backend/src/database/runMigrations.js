const db = require('../config/db');
const { logger } = require('../utils/logger');

/**
 * Automated Migration Runner
 * Runs on app startup to ensure database schema is up to date
 */

async function runMigrations() {
  return new Promise((resolve, reject) => {
    console.log('🔄 Running automated migrations...\n');

    // Migration 1: Add is_best_seller column to products
    const addBestSellerSQL = `
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_best_seller BOOLEAN DEFAULT 0
    `;

    db.query(addBestSellerSQL, (err) => {
      if (err && err.code !== 'ER_DUP_FIELDNAME') {
        logger.error(`Migration failed - is_best_seller: ${err.message}`);
        return reject(err);
      }
      console.log('✅ Migration: is_best_seller column');

      // Migration 1b: Add is_luxury_product column to products
      const addLuxurySQL = `
        ALTER TABLE products ADD COLUMN IF NOT EXISTS is_luxury_product BOOLEAN DEFAULT 0
      `;

      db.query(addLuxurySQL, (err) => {
        if (err && err.code !== 'ER_DUP_FIELDNAME') {
          logger.error(`Migration failed - is_luxury_product: ${err.message}`);
          return reject(err);
        }
        console.log('✅ Migration: is_luxury_product column');

        // Migration 2: Create reviews table
        const createReviewsTableSQL = `
          CREATE TABLE IF NOT EXISTS reviews (
            id INT PRIMARY KEY AUTO_INCREMENT,
            product_id INT NOT NULL,
            reviewer_name VARCHAR(255) NOT NULL,
            rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
            review_text TEXT NOT NULL,
            verified_purchase BOOLEAN DEFAULT 0,
            is_approved BOOLEAN DEFAULT 1,
            is_featured BOOLEAN DEFAULT 0,
            is_active BOOLEAN DEFAULT 1,
            created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
            updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
            INDEX idx_product (product_id),
            INDEX idx_rating (rating)
          )
        `;

        db.query(createReviewsTableSQL, (err) => {
          if (err) {
            logger.error(`Migration failed - reviews table: ${err.message}`);
            return reject(err);
          }
          console.log('✅ Migration: reviews table');
          resolve();
        });
      });
    });
  });
}

module.exports = { runMigrations };
