/**
 * Migrate stored image URLs in `product_images.image_url` to object keys.
 * This script is conservative: it reads rows, uses the existing backend
 * extractor logic to determine object key, and updates rows only when
 * the extracted key is different from the stored value.
 *
 * Run locally (from backend folder):
 *   node src/database/scripts/migrate-image-urls-to-keys.js
 */
const db = require('../../config/db.pool');
const imageURLService = require('../../services/imageURLService');
const { logger } = require('../../utils/logger');

async function run() {
  const conn = await db.getConnection();
  try {
    console.log('🔄 Starting image URL -> object key migration');

    const [rows] = await conn.execute('SELECT id, image_url FROM product_images');
    console.log(`📦 Found ${rows.length} image rows`);

    let updated = 0;
    for (const r of rows) {
      const current = r.image_url || '';
      const key = imageURLService.extractObjectKey(current) || '';

      // If extractor returned a smaller key (no http) and it's different, update
      if (key && key !== current && !key.startsWith('http')) {
        await conn.execute('UPDATE product_images SET image_url = ? WHERE id = ?', [key, r.id]);
        updated++;
        if (updated % 50 === 0) console.log(`  · Updated ${updated} rows so far`);
      }
    }

    console.log(`✅ Migration complete. Rows updated: ${updated}`);
  } catch (err) {
    logger.error('Migration failed:', err && err.message ? err.message : err);
    process.exitCode = 1;
  } finally {
    conn.release();
    process.exit();
  }
}

run();
