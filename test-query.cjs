const db = require('C:\\Users\\nikam\\OneDrive\\Desktop\\Perfect\\bhatkar-fragrance-hub\\backend\\src\\config\\db.config.js');
const logger = { error: (msg) => console.error(msg), info: (msg) => console.log(msg) };

async function testQuery() {
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

    const [rows] = await db.query(query);
    console.log('Row type:', typeof rows[0]);
    console.log('Images type:', typeof rows[0].images);
    console.log('Images value:', rows[0].images);
    console.log('Images instanceof Array?', Array.isArray(rows[0].images));
    console.log('Images as string:', JSON.stringify(rows[0].images));
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testQuery();
