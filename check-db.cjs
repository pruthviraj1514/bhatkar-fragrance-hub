const mysql = require('mysql2/promise');

async function checkProducts() {
  try {
    const connection = await mysql.createConnection({
      host: 'shinkansen.proxy.rlwy.net',
      user: 'root',
      password: 'tpPfcKjqZpEqGgtLbykJYBsyturBALMV',
      database: 'railway',
      port: 11735
    });

    console.log('Connected to database');

    const [products] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log('Total products:', products[0].count);

    const [images] = await connection.execute('SELECT COUNT(*) as count FROM product_images');
    console.log('Total images:', images[0].count);

    const [productsWithImages] = await connection.execute(`
      SELECT 
        p.id, 
        p.name, 
        COUNT(pi.id) as image_count 
      FROM products p 
      LEFT JOIN product_images pi ON p.id = pi.product_id 
      GROUP BY p.id
      LIMIT 5
    `);
    
    console.log('\nFirst 5 products with image counts:');
    productsWithImages.forEach(p => {
      console.log(`  - ${p.name} (ID: ${p.id}): ${p.image_count} images`);
    });

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkProducts();
