import mysql from 'mysql2/promise';

async function addImageFormatColumn() {
  try {
    console.log('🔧 Connecting to MySQL...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      port: process.env.DB_PORT,
      database: process.env.DB_NAME
    });

    console.log('✅ Connected to database!\n');

    // Check if column already exists
    console.log('🔍 Checking if image_format column exists...');
    const [columns] = await connection.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'product_images' AND COLUMN_NAME = 'image_format'`
    );

    if (columns.length === 0) {
      console.log('📝 Adding image_format column to product_images table...');
      const addColumnQuery = `
        ALTER TABLE product_images 
        ADD COLUMN image_format VARCHAR(10) NOT NULL DEFAULT 'jpg' 
        AFTER image_url
      `;
      await connection.query(addColumnQuery);
      console.log('✅ image_format column added successfully!\n');

      // Verify column was added
      console.log('🔍 Verifying column structure...');
      const [cols] = await connection.query('DESCRIBE product_images');
      cols.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type}${col.Null === 'NO' ? ' (NOT NULL)' : ''}`);
      });
    } else {
      console.log('✅ image_format column already exists!\n');
    }

    console.log('\n✨ Migration successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addImageFormatColumn();
