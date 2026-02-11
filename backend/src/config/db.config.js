const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('../utils/secrets');

// Log connection details (mask password for security)
logger.info(`📊 Database Configuration:
  Host: ${DB_HOST}
  Port: ${DB_PORT}
  User: ${DB_USER}
  Database: ${DB_NAME}
  SSL: ${process.env.NODE_ENV === 'production' ? 'enabled' : 'disabled'}
  Node Env: ${process.env.NODE_ENV || 'development'}`);

// Production-ready connection pool with SSL
const pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    ssl: process.env.NODE_ENV === 'production' ? true : false,
    enableKeepAlive: true
});

// Attempt to verify DB connectivity with retries (exponential backoff)
async function verifyConnectionWithRetry(maxAttempts = 15, initialDelayMs = 3000) {
    let attempt = 0;
    let delay = initialDelayMs;

    while (attempt < maxAttempts) {
        try {
            attempt++;
            logger.info(`🔄 Attempting database connection (${attempt}/${maxAttempts})...`);
            const conn = await pool.getConnection();
            conn.release();
            logger.info('✅ Database pool created and verified successfully!');
            return true;
        } catch (err) {
            logger.warn(`❌ Database pool creation failed (attempt ${attempt}/${maxAttempts}): ${err.message}`);
            if (attempt >= maxAttempts) {
                logger.error(`⚠️  Max DB connection attempts reached after ${maxAttempts} tries.`);
                logger.error('Possible causes:');
                logger.error('  1. Database service not running or not accessible');
                logger.error('  2. Incorrect DB_HOST, DB_USER, or DB_PASSWORD');
                logger.error('  3. Database service not online yet (will retry on next request)');
                logger.error('  4. Network connectivity issue between app and database');
                logger.error('Continuing without DB... API requests will fail gracefully.');
                return false;
            }
            // wait before retrying
            await new Promise(res => setTimeout(res, delay));
            // exponential backoff with cap
            delay = Math.min(delay * 1.5, 30000);
        }
    }
}

// Start verification but do not exit process if DB is not yet available.
verifyConnectionWithRetry().catch(err => {
    logger.error('Unexpected error during DB verification:', err.message);
});

module.exports = pool;

