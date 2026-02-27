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
    max: NODE_ENV === 'production' ? 15 : 10,  // Max connections
    idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
    connectionTimeoutMillis: 10000,  // Return error after 10s if connection not established
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
        if (['INSERT', 'UPDATE', 'DELETE'].includes(res.command)) {
            const resultObj = res.rows.length > 0 ? { ...res.rows[0] } : {};
            resultObj.insertId = resultObj.id || null;
            resultObj.affectedRows = res.rowCount;
            // Returning an array where first element is result object
            return [resultObj, res.fields];
        }
        // Returning an array where first element is rows array
        return [res.rows, res.fields];
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
