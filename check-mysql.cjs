const mysql = require('mysql2/promise');

async function checkVersion() {
  try {
    const connection = await mysql.createConnection({
      host: 'shinkansen.proxy.rlwy.net',
      user: 'root',
      password: 'tpPfcKjqZpEqGgtLbykJYBsyturBALMV',
      database: 'railway',
      port: 11735
    });

    const [version] = await connection.execute('SELECT VERSION() as version');
    console.log('MySQL Version:', version[0].version);

    // Test the query
    try {
      const [result] = await connection.execute(`
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
            ) ORDER BY pi.image_order
          ) as images
        FROM products p
        LEFT JOIN product_images pi ON p.id = pi.product_id
        GROUP BY p.id
        ORDER BY p.created_on DESC
      `);
      console.log('\nQuery succeeded!');
      console.log('Products:', result.length);
      if (result.length > 0) {
        console.log('First product:', result[0].name);
        try {
          const images = JSON.parse(result[0].images);
          console.log('First product images:', images.length);
        } catch (e) {
          console.log('Could not parse images:', result[0].images);
        }
      }
    } catch (queryError) {
      console.log('\nQuery failed with error:');
      console.log(queryError.message);
      
      // Try simplified version without ORDER BY
      console.log('\nTrying simplified query without ORDER BY in JSON_ARRAYAGG...');
      const [result2] = await connection.execute(`
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
      `);
      console.log('Simplified query succeeded!');
      console.log('Products:', result2.length);
    }

    await connection.end();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkVersion();
