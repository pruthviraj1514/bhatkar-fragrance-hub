const mysql = require('mysql2/promise');
require('dotenv').config();

const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('./src/utils/secrets');

const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

(async () => {
  try {
    const connection = await pool.getConnection();
    const query = `
      SELECT 
        p.id, p.name, p.brand, p.price,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', pi.id,
            'image_url', pi.image_url,
            'alt_text', pi.alt_text,
            'image_order', pi.image_order,
            'is_thumbnail', pi.is_thumbnail
          )
        ) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id
      ORDER BY p.created_on DESC
      LIMIT 10
    `;
    
    const [rows] = await connection.execute(query);
    console.log(`Retrieved ${rows.length} products:`)
    rows.forEach((product, idx) => {
      console.log(`\nProduct ${idx + 1}:`, product.id, product.name);
      console.log(`  Images count: ${product.images.length}`);
      console.log(`  Images with URLs: ${product.images.filter(img => img.image_url).length}`);
    });
    
    connection.release();
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Error type:', typeof error);
    console.error('Error object:', error);
    pool.end();
  }
})();
