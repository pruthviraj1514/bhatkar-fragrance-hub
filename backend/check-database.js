import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to Railway database...');
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected!\n');

    // Check product_images table structure
    console.log('📋 Checking product_images table structure:');
    const [columns] = await connection.query('DESCRIBE product_images');
    console.log(columns);

    console.log('\n📊 Checking products and images count:');
    const [products] = await connection.query('SELECT COUNT(*) as count FROM products');
    const [images] = await connection.query('SELECT COUNT(*) as count FROM product_images');
    console.log('Total products:', products[0].count);
    console.log('Total images:', images[0].count);

    // Get sample products with images
    console.log('\n🖼️  Sample products with images:');
    const [result] = await connection.query(`
      SELECT p.id, p.name, COUNT(pi.id) as image_count
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id, p.name
      LIMIT 5
    `);
    console.log(result);

    // Check what the actual product with images endpoint returns
    console.log('\n🔎 Checking actual image records:');
    const [images_detail] = await connection.query(`
      SELECT * FROM product_images LIMIT 3
    `);
    console.log(images_detail);

    await connection.end();
    console.log('\n✅ Database check complete!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabase();
