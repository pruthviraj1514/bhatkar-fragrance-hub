import mysql from 'mysql2/promise';

async function verifyDatabase() {
  try {
    console.log('🔧 Connecting to Railway MySQL...');
    const connection = await mysql.createConnection({
      host: 'shinkansen.proxy.rlwy.net',
      user: 'root',
      password: 'tpPfcKjqZpEqGgtLbykJYBsyturBALMV',
      database: 'railway',
      port: 11735
    });

    console.log('✅ Connected to Railway MySQL!\n');

    // Get list of tables
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'railway'
    `);

    console.log('📊 Tables in "railway" database:');
    tables.forEach(table => {
      console.log(`  ✓ ${table.TABLE_NAME}`);
    });

    // Check users table structure
    console.log('\n👥 Users table structure:');
    const [usersStructure] = await connection.query('DESCRIBE users');
    usersStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // Check products table structure
    console.log('\n📦 Products table structure:');
    const [productsStructure] = await connection.query('DESCRIBE products');
    productsStructure.forEach(col => {
      console.log(`  - ${col.Field}: ${col.Type}`);
    });

    // Count records
    const [userCount] = await connection.query('SELECT COUNT(*) as count FROM users');
    const [productCount] = await connection.query('SELECT COUNT(*) as count FROM products');

    console.log(`\n📈 Record counts:`);
    console.log(`  Users: ${userCount[0].count}`);
    console.log(`  Products: ${productCount[0].count}`);

    console.log('\n✨ Railway database verification successful!');
    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
