const mysql = require('mysql2/promise');

async function testQuery() {
  const connection = await mysql.createConnection({
    host: 'shinkansen.proxy.rlwy.net',
    user: 'root',
    password: 'tpPfcKjqZpEqGgtLbykJYBsyturBALMV',
    database: 'railway',
    port: 11735
  });

  try {
    const query = `
      SELECT 
        p.id, p.name, p.brand, p.price, p.category, p.concentration, 
        p.description, p.stock, p.created_on,
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
      LIMIT 1
    `;

    const [rows] = await connection.execute(query);
    const row = rows[0];
    
    console.log('✓ Query executed successfully');
    console.log('Row:', { name: row.name, id: row.id });
    console.log('Images type:', typeof row.images);
    console.log('Images value:', row.images);
    
    if (typeof row.images === 'string') {
      console.log('\n✓ Images is a STRING (needs JSON.parse)');
      try {
        const parsed = JSON.parse(row.images);
        console.log('  Parsed successfully:', parsed.length, 'images');
      } catch (e) {
        console.log('  ✗ Failed to parse:', e.message);
      }
    } else if (Array.isArray(row.images)) {
      console.log('\n✓ Images is ALREADY AN ARRAY (no parsing needed)');
      console.log('  Array length:', row.images.length);
    } else {
      console.log('\n? Images is an unexpected type:', typeof row.images);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

testQuery();
