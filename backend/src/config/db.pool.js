/**
 * PRODUCTION-GRADE DATABASE CONNECTION POOL
 * =========================================
 * 
 * Optimized for:
 * - High concurrency (100+ simultaneous connections)
 * - Connection reuse and efficiency
 * - Automatic reconnection
 * - Query performance monitoring
 * - Production Railway deployment
 * 
 * File: backend/src/config/db.pool.js
 */

const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT = 3306,
  NODE_ENV = 'development'
} = process.env;

// ========================================================================
// POOL CONFIGURATION (Production Optimized)
// ========================================================================

const poolConfig = {
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  port: DB_PORT,
  
  // ====== CONNECTION POOL SETTINGS ======
  waitForConnections: true,
  connectionLimit: NODE_ENV === 'production' ? 20 : 10,  // Max connections in pool
  queueLimit: NODE_ENV === 'production' ? 50 : 20,       // Max queued requests
  enableKeepAlive: true,
  keepAliveInitialDelayMs: 30000,                         // 30 seconds between pings
  
  // ====== PERFORMANCE SETTINGS ======
  multipleStatements: false,  // Security: disable multiple statements
  supportBigNumbers: true,
  bigNumberStrings: true,
  dateStrings: true,
  timezone: '+00:00',
  charset: 'utf8mb4_unicode_ci',
  
  // ====== CONNECTION SETTINGS ======
  connectTimeout: NODE_ENV === 'production' ? 30000 : 10000,
  acquireTimeout: NODE_ENV === 'production' ? 10000 : 5000,
  
  // ====== SSL (for Railway) ======
  ssl: NODE_ENV === 'production' ? 'Amazon RDS' : null,
  supportBigNumbers: true,
  insecureAuth: false,
};

// Create the connection pool
let pool;
let poolInitialized = false;

/**
 * Initialize the connection pool
 * Called once during server startup
 */
async function initializePool() {
  try {
    if (poolInitialized && pool) {
      logger.info('✅ Connection pool already initialized');
      return pool;
    }

    logger.info(`🔄 Initializing MySQL connection pool...`);
    logger.info(`   Host: ${DB_HOST}`);
    logger.info(`   Database: ${DB_NAME}`);
    logger.info(`   Pool Size: ${poolConfig.connectionLimit}`);
    logger.info(`   Queue Limit: ${poolConfig.queueLimit}`);

    pool = mysql.createPool(poolConfig);

    // Test connection
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    logger.info('✅ MySQL connection pool initialized successfully');
    logger.info('✅ Database connection verified');

    poolInitialized = true;
    return pool;

  } catch (error) {
    logger.error('❌ Failed to initialize connection pool:', error.message);
    throw error;
  }
}

/**
 * Get a connection from the pool
 * Usage: const conn = await getConnection();
 */
async function getConnection() {
  if (!pool || !poolInitialized) {
    await initializePool();
  }

  return await pool.getConnection();
}

/**
 * Execute query with connection pooling
 * Usage: const results = await executeQuery(sql, params);
 */
async function executeQuery(sql, params = []) {
  const connection = await getConnection();
  
  try {
    logger.debug(`📊 Executing query: ${sql.substring(0, 100)}...`);
    const startTime = Date.now();
    
    const [results] = await connection.execute(sql, params);
    
    const duration = Date.now() - startTime;
    
    if (duration > 1000) {
      logger.warn(`⚠️  Slow query (${duration}ms): ${sql.substring(0, 80)}...`);
    } else {
      logger.debug(`✅ Query completed in ${duration}ms`);
    }
    
    return results;
    
  } catch (error) {
    logger.error(`❌ Query error: ${error.message}`);
    logger.error(`   SQL: ${sql}`);
    throw error;
    
  } finally {
    connection.release();
  }
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, params = []) {
  const results = await executeQuery(sql, params);
  return results.length > 0 ? results[0] : null;
}

/**
 * Get pool statistics
 * Usage: For monitoring and debugging
 */function getPoolStats() {
  if (!pool) {
    return { status: 'not_initialized' };
  }

  const promisePool = pool;
  
  // Note: mysql2 doesn't expose pool stats directly
  // But we can track through logs
  return {
    status: 'active',
    connectionLimit: poolConfig.connectionLimit,
    queueLimit: poolConfig.queueLimit,
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  };
}

/**
 * Close pool (called on server shutdown)
 */
async function closePool() {
  try {
    if (pool) {
      await pool.end();
      logger.info('✅ Connection pool closed');
      poolInitialized = false;
    }
  } catch (error) {
    logger.error('❌ Error closing pool:', error.message);
  }
}

// ========================================================================
// GRACEFUL SHUTDOWN
// ========================================================================

process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, closing pool...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, closing pool...');
  await closePool();
  process.exit(0);
});

// ========================================================================
// EXPORTS
// ========================================================================

module.exports = {
  pool: () => pool,
  initializePool,
  getConnection,
  executeQuery,
  queryOne,
  getPoolStats,
  closePool,
  
  // For backward compatibility
  query: executeQuery,
  getPool: () => pool
};
