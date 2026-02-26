/**
 * CONSOLIDATED DATABASE CONFIGURATION
 * ===================================
 * This file replaces db.config.js and db.pool.js to provide a single,
 * optimized MySQL connection pool using the project's root .env.
 */

const mysql = require('mysql2/promise');
const path = require('path');
// Ensure environment variables are loaded from the root .env
// backend/src/config/db.js -> ../../../.env
const envPath = path.join(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const { logger } = require('../utils/logger');

const {
    DB_HOST,
    DB_USER,
    DB_PASSWORD,
    DB_PASS,
    DB_NAME,
    DB_PORT = 3306,
    NODE_ENV = 'development'
} = process.env;

if (!DB_HOST) {
    logger.error(`❌ DB_HOST is missing! Checked .env at: ${envPath}`);
}

// Support both DB_PASSWORD and DB_PASS (Railway often uses DB_PASS)
const dbPassword = DB_PASSWORD || DB_PASS || '';

const poolConfig = {
    host: DB_HOST,
    user: DB_USER,
    password: dbPassword,
    database: DB_NAME,
    port: Number(DB_PORT),
    waitForConnections: true,
    connectionLimit: NODE_ENV === 'production' ? 15 : 10,
    queueLimit: 0,
    // Removed enableKeepAlive for compatibility
    charset: 'utf8mb4',
    connectTimeout: 30000,
    // Try without SSL first to rule it out, or use simple boolean
    ssl: NODE_ENV === 'production' ? { rejectUnauthorized: false } : null,
};

logger.info(`📊 Database Initialization:
  Host: ${DB_HOST}
  User: ${DB_USER}
  Database: ${DB_NAME}
  Port: ${poolConfig.port}
  Env: ${NODE_ENV}`);

const pool = mysql.createPool(poolConfig);

/**
 * Verify connectivity on startup with retry logic
 */
async function verifyConnection(maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const connection = await pool.getConnection();
            await connection.ping();
            connection.release();
            logger.info('✅ Database pool verified successfully');
            return true;
        } catch (err) {
            logger.error(`❌ DB Connection failed (attempt ${attempt}/${maxAttempts}): ${err.message}`);
            if (attempt === maxAttempts) {
                logger.error('CRITICAL: Could not establish database connection. Checks your .env variables.');
            } else {
                // Wait 2 seconds before retry
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }
    return false;
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, params = []) {
    const [results] = await pool.execute(sql, params);
    return results.length > 0 ? results[0] : null;
}

// Initial verification
verifyConnection().catch(err => logger.error('Unhandled DB verification error:', err));

module.exports = {
    query: (sql, params) => pool.query(sql, params),
    execute: (sql, params) => pool.execute(sql, params),
    executeQuery: (sql, params) => pool.execute(sql, params),
    queryOne,
    getConnection: () => pool.getConnection(),
    pool: pool,
    verifyConnection
};
