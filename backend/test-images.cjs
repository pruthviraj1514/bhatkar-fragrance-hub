const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'shinkansen.proxy.rlwy.net',
  port: process.env.DB_PORT || 11735,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'fragrance_hub_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true
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
            'image_url', pi.image_url
          )
        ) as images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id
      LIMIT 1
    `;
    
    const [rows] = await connection.execute(query);
    console.log('First product:', JSON.stringify(rows[0], null, 2));
    console.log('Images type:', typeof rows[0].images);
    console.log('Is array:', Array.isArray(rows[0].images));
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
