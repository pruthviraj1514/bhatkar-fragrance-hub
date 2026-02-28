/**
 * CONSOLIDATED DATABASE CONFIGURATION (POSTGRESQL)
 * ================================================
 * This file replaces db.config.js, db.pool.js, and db.compat.js 
 * to provide a single, optimized PostgreSQL connection pool using pg.
 */

const { Pool } = require('pg');
const path = require('path');
// Ensure environment variables are loaded from the root .env
const envPath = path.join(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const { logger } = require('../utils/logger');

// We will use DATABASE_URL directly if provided, falling back to SUPABASE_DB_URL
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const NODE_ENV = process.env.NODE_ENV || 'development';

if (!connectionString) {
    logger.error(`❌ DATABASE_URL or SUPABASE_DB_URL is missing! Checked .env at: ${envPath}`);
}

const poolConfig = {
    connectionString: connectionString,
    // Connection Pool Settings
    max: 10,  // Max connections restricted to 10 for Supabase connection pooler
    idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000,  // Prevent requests from hanging - fail fast!
    query_timeout: 20000, // Relaxed to 20s for complex product joins
    // SSL Configuration for Supabase
    ssl: {
        rejectUnauthorized: false
    }
};

logger.info(`📊 Database Initialization (PostgreSQL):
  Max Pool Size: ${poolConfig.max}
  Env: ${NODE_ENV}`);

const pool = new Pool(poolConfig);

/**
 * Verify connectivity on startup with retry logic
 */
async function verifyConnection(maxAttempts = 5) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT NOW()');
            client.release();
            logger.info('✅ PostgreSQL Database pool verified successfully - Time:', result.rows[0].now);
            return true;
        } catch (err) {
            logger.error(`❌ DB Connection failed (attempt ${attempt}/${maxAttempts}): ${err.message}`);
            logger.error('Full connection error details:', err);

            // Diagnostics per requirements
            logger.error('Diagnostic Checks:');
            logger.error('- SSL configuration: Ensure ssl: { rejectUnauthorized: false } is set.');
            logger.error('- Port: Ensure port 6543 is used for Supabase connection pooler.');
            logger.error('- Password: Ensure password encoding is correct in DATABASE_URL (e.g., %40 for @).');

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
    const result = await pool.query(sql, params);
    return result.rows.length > 0 ? result.rows[0] : null;
}

// Initial verification
verifyConnection().catch(err => logger.error('Unhandled DB verification error:', err));

const queryWrapper = async (text, params) => {
    try {
        const res = await pool.query(text, params);
        return res;
    } catch (err) {
        logger.error(`Database query error: ${err.message}\nQuery: ${text}`);
        throw err;
    }
};

// Expose standard interfaces for querying
module.exports = {
    query: queryWrapper,
    execute: queryWrapper,
    executeQuery: queryWrapper,
    queryOne,
    getConnection: () => pool.connect(),
    pool: pool,
    verifyConnection
};
