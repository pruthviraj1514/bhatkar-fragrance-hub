const db = require('../../config/db');
const { logger } = require('../../utils/logger');

async function migrateToSupabaseStorage() {
    const supabaseBaseUrl = 'https://kztbfdzvulahrivixgkx.supabase.co/storage/v1/object/public/products';
    const legacyHost = 't3.storageapi.dev';

    try {
        logger.info('🚀 Starting migration of image URLs to Supabase Storage...');

        // 1. Fetch all product images
        const result = await db.query('SELECT id, image_url, product_id FROM product_images');
        const images = result.rows;

        logger.info(`Found ${images.length} images to check.`);

        let updatedCount = 0;

        for (const img of images) {
            if (img.image_url && (img.image_url.includes(legacyHost) || !img.image_url.startsWith('http'))) {
                let newUrl = img.image_url;

                // Extract key from Railway URL
                // Example: https://t3.storageapi.dev/stocked-cupboard-bdb4pjnh/products/image.jpg
                // Or sometimes: stocked-cupboard-bdb4pjnh/products/image.jpg

                if (img.image_url.includes(legacyHost)) {
                    const parts = img.image_url.split('/');
                    // Find 'products' index
                    const productsIdx = parts.findIndex(p => p === 'products');
                    if (productsIdx >= 0) {
                        const key = parts.slice(productsIdx).join('/');
                        newUrl = `${supabaseBaseUrl}/${key}`;
                    }
                } else if (!img.image_url.startsWith('http')) {
                    // Assume it's a key
                    newUrl = `${supabaseBaseUrl}/${img.image_url.startsWith('/') ? img.image_url.slice(1) : img.image_url}`;
                }

                if (newUrl !== img.image_url) {
                    logger.info(`Updating image ${img.id} (Product ${img.product_id}):`);
                    logger.info(`  FROM: ${img.image_url}`);
                    logger.info(`  TO:   ${newUrl}`);

                    await db.query('UPDATE product_images SET image_url = $1 WHERE id = $2', [newUrl, img.id]);
                    updatedCount++;
                }
            }
        }

        logger.info(`✅ Migration completed! Updated ${updatedCount} image URLs.`);
        process.exit(0);
    } catch (error) {
        logger.error(`❌ Migration failed: ${error.message}`);
        process.exit(1);
    }
}

migrateToSupabaseStorage();
