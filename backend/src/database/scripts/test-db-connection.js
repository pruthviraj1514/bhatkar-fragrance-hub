const dotenv = require('dotenv');
dotenv.config({ path: process.cwd() + '/backend/.env' });
const db = require('../../../src/config/db');
(async () => {
  const cfg = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS || process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : undefined,
    connectTimeout: 10000,
  };

  console.log('Attempting DB connection with config:', {
    host: cfg.host,
    user: cfg.user,
    database: cfg.database,
    port: cfg.port,
  });

  try {
    const res = await db.query('SELECT 1 as ok');
    console.log('Query result:', res);
    console.log('Connection test succeeded');
    process.exit(0);
  } catch (err) {
    console.error('DB connection error:');
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();
