const db = require('../../config/db');

async function fixStorageUrls() {
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  console.log('Using DB:', connectionString ? connectionString.split('@')[1] : 'NOT FOUND');

  const supabaseBaseUrl = 'https://kztbfdzvulahrivixgkx.supabase.co/storage/v1/object/public/products/';
  const legacyRailwayPrefix = 'https://t3.storageapi.dev/stocked-cupboard-bdb4pjnh/products/';
  const duplicatedSupabasePrefix = 'https://kztbfdzvulahrivixgkx.supabase.co/storage/v1/object/public/products/products/';

  console.log('🚀 Starting storage URL cleanup...');

  try {
    // 0. Diagnostic: Check what's actually there
    const all = await db.query("SELECT image_url FROM product_images");
    console.log(`Found ${all.rows.length} total images in DB.`);
    all.rows.forEach((row, i) => {
      console.log(`[${i}] URL: ${JSON.stringify(row.image_url)}`);
    });

    console.log(`✅ Fixed ${railwayFix.rowCount} legacy Railway URLs.`);

    // 2. Fix duplicated 'products/products' URLs
    const duplicationFix = await db.query(`
      UPDATE product_images
      SET image_url = REPLACE(
        image_url,
        $1,
        $2
      )
      WHERE image_url LIKE '%/products/products/%'
    `, [duplicatedSupabasePrefix, supabaseBaseUrl]);

    console.log(`✅ Fixed ${duplicationFix.rowCount} duplicated Supabase paths.`);

    // 3. Absolute Validation - Log any remaining bad URLs
    const remainingBad = await db.query(`
      SELECT id, image_url FROM product_images 
      WHERE image_url LIKE '%storageapi.dev%' 
      OR image_url LIKE '%/products/products/%'
    `);

    if (remainingBad.rows.length > 0) {
      console.warn(`⚠️ Warning: ${remainingBad.rows.length} issues still remain in database!`);
      remainingBad.rows.forEach(row => console.warn(`  - ID ${row.id}: ${row.image_url}`));
    } else {
      console.log('✨ Database is now clean of legacy and duplicated storage URLs.');
    }

    process.exit(0);
  } catch (error) {
    console.error(`❌ Cleanup failed: ${error.message}`);
    process.exit(1);
  }
}

fixStorageUrls();
