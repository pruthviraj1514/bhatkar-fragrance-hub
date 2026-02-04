/**
 * Image Format Verification Script
 * Tests the image format functionality
 */

require('dotenv/config');
const mysql = require('mysql2/promise');

// Validate environment variables early for clearer errors
const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`\n❌ Missing environment variables: ${missing.join(', ')}\nSet them in your shell or in backend/.env before running this script.`);
  process.exit(1);
}

async function verifyImageFormatSetup() {
  try {
    console.log('🔍 Image Format Setup Verification\n');
    console.log('📋 Connecting to database...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS || process.env.DB_PASSWORD,
      port: process.env.DB_PORT || 3306,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected!\n');

    // 1. Check if image_format column exists
    console.log('1️⃣  Checking image_format column...');
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'product_images' AND TABLE_SCHEMA = ?`,
      [process.env.DB_NAME]
    );

    const imageFormatColumn = columns.find(col => col.COLUMN_NAME === 'image_format');
    
    if (imageFormatColumn) {
      console.log('   ✅ image_format column exists');
      console.log(`   - Type: ${imageFormatColumn.DATA_TYPE}`);
      console.log(`   - Nullable: ${imageFormatColumn.IS_NULLABLE}`);
      console.log(`   - Default: ${imageFormatColumn.COLUMN_DEFAULT}`);
    } else {
      console.log('   ❌ image_format column NOT FOUND');
      console.log('   Please run: node src/database/scripts/addImageFormatColumn.js');
      await connection.end();
      return false;
    }

    // 2. Check table structure
    console.log('\n2️⃣  Table structure:');
    const [allColumns] = await connection.query(
      `DESCRIBE product_images`
    );
    console.log('   Columns in product_images:');
    allColumns.forEach(col => {
      const indicator = col.Field === 'image_format' ? ' ← NEW' : '';
      console.log(`   - ${col.Field}: ${col.Type}${indicator}`);
    });

    // 3. Check existing images
    console.log('\n3️⃣  Analyzing existing images...');
    const [images] = await connection.query(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN image_format IS NULL THEN 1 ELSE 0 END) as null_format,
              SUM(CASE WHEN image_format = 'jpg' THEN 1 ELSE 0 END) as jpg_count,
              SUM(CASE WHEN image_format = 'png' THEN 1 ELSE 0 END) as png_count,
              SUM(CASE WHEN image_format = 'gif' THEN 1 ELSE 0 END) as gif_count,
              SUM(CASE WHEN image_format = 'webp' THEN 1 ELSE 0 END) as webp_count
       FROM product_images`
    );

    const stats = images[0];
    console.log(`   Total images: ${stats.total}`);
    console.log(`   - JPG: ${stats.jpg_count || 0}`);
    console.log(`   - PNG: ${stats.png_count || 0}`);
    console.log(`   - GIF: ${stats.gif_count || 0}`);
    console.log(`   - WEBP: ${stats.webp_count || 0}`);
    console.log(`   - NULL/Unknown: ${stats.null_format || 0}`);

    // 4. Sample image data
    console.log('\n4️⃣  Sample image records:');
    const [sampleImages] = await connection.query(
      `SELECT id, product_id, image_url, image_format, alt_text 
       FROM product_images LIMIT 3`
    );

    if (sampleImages.length > 0) {
      sampleImages.forEach((img, idx) => {
        console.log(`\n   Image ${idx + 1}:`);
        console.log(`   - ID: ${img.id}`);
        console.log(`   - Format: ${img.image_format}`);
        console.log(`   - URL: ${img.image_url.substring(0, 50)}...`);
      });
    } else {
      console.log('   No images found in database');
    }

    // 5. Test extraction logic
    console.log('\n5️⃣  Format extraction test:');
    const testUrls = [
      'https://example.com/image.jpg',
      'https://example.com/image.png',
      'https://example.com/image.gif',
      'https://example.com/image.webp',
      'https://example.com/image',
      'https://example.com/image?size=500'
    ];

    const extractFormat = (url) => {
      if (!url) return 'jpg';
      const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      return match && match[1] ? match[1].toLowerCase() : 'jpg';
    };

    testUrls.forEach(url => {
      const format = extractFormat(url);
      console.log(`   ${url} → ${format}`);
    });

    console.log('\n✅ Verification complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your backend server');
    console.log('2. Upload new products with images');
    console.log('3. Images should now display correctly');

    await connection.end();
    return true;

  } catch (error) {
    console.error('\n❌ Error during verification:', error.message);
    process.exit(1);
  }
}

verifyImageFormatSetup();
