/**
 * SUPABASE POSTGRESQL CONNECTION CONFIGURATION
 * ============================================
 * 
 * Production-ready PostgreSQL connection using Supabase pooler
 * Uses port 6543 for connection pooling (recommended for production)
 * 
 * Supabase Project:
 * - URL: https://tntyfwpaxiyaovdiphql.supabase.co
 * - Pooler Port: 6543
 * - Direct Port: 5432
 */

const { Pool } = require('pg');
const { logger } = require('../utils/logger');

// Supabase connection configuration
// Use pooler port (6543) for production stability
const poolConfig = {
  // Connection string format: postgres://postgres:[PASSWORD]@db.tntyfwpaxiyaovdiphql.supabase.co:6543/postgres
  connectionString: process.env.SUPABASE_DB_URL,
  
  // SSL Configuration for Supabase
  ssl: {
    rejectUnauthorized: false // Required for Supabase connections
  },
  
  // Connection Pool Settings
  max: process.env.NODE_ENV === 'production' ? 20 : 10,  // Max connections
  idleTimeoutMillis: 30000,  // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000,  // Return error after 10s if connection not established
  
  // Query execution settings
  query_timeout: 10000,  // 10 second query timeout
  
  // Statement timeout for long-running queries
  statement_timeout: 15000,  // 15 second statement timeout
};

// Create the connection pool
let pool;
let poolInitialized = false;

/**
 * Initialize the PostgreSQL connection pool
 */
async function initializePool() {
  try {
    if (poolInitialized && pool) {
      logger.info('✅ PostgreSQL connection pool already initialized');
      return pool;
    }

    logger.info('🔄 Initializing Supabase PostgreSQL connection pool...');
    logger.info(`   Connection: ${process.env.SUPABASE_DB_URL ? 'Configured' : 'NOT SET'}`);
    logger.info(`   Pool Size: ${poolConfig.max}`);
    logger.info(`   Pooler Port: 6543`);

    pool = new Pool(poolConfig);

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, version() as pg_version');
    client.release();

    logger.info('✅ PostgreSQL connection pool initialized successfully');
    logger.info(`   Database Time: ${result.rows[0].current_time}`);
    logger.info(`   PostgreSQL Version: ${result.rows[0].pg_version}`);

    poolInitialized = true;
    return pool;

  } catch (error) {
    logger.error('❌ Failed to initialize PostgreSQL pool:', error.message);
    throw error;
  }
}

/**
 * Get a connection from the pool
 */
async function getConnection() {
  if (!pool || !poolInitialized) {
    await initializePool();
  }
  return await pool.connect();
}

/**
 * Execute a query with error handling and logging
 */
async function executeQuery(sql, params = []) {
  if (!pool || !poolInitialized) {
    await initializePool();
  }

  try {
    logger.debug(`📊 Executing query: ${sql.substring(0, 80)}...`);
    const startTime = Date.now();

    const result = await pool.query(sql, params);

    const duration = Date.now() - startTime;

    if (duration > 1000) {
      logger.warn(`⚠️  Slow query (${duration}ms): ${sql.substring(0, 60)}...`);
    } else {
      logger.debug(`✅ Query completed in ${duration}ms`);
    }

    return result;

  } catch (error) {
    logger.error(`❌ Query error: ${error.message}`);
    logger.error(`   SQL: ${sql}`);
    logger.error(`   Params: ${JSON.stringify(params)}`);
    throw error;
  }
}

/**
 * Execute query and return single row
 */
async function queryOne(sql, params = []) {
  const result = await executeQuery(sql, params);
  return result.rows.length > 0 ? result.rows[0] : null;
}

/**
 * Get pool statistics
 */
function getPoolStats() {
  if (!pool) {
    return { status: 'not_initialized' };
  }

  return {
    status: 'active',
    poolSize: poolConfig.max,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  };
}

/**
 * Close the pool
 */
async function closePool() {
  try {
    if (pool) {
      await pool.end();
      logger.info('✅ PostgreSQL connection pool closed');
      poolInitialized = false;
    }
  } catch (error) {
    logger.error('❌ Error closing pool:', error.message);
  }
}

// Health check function for /api/health endpoint
async function healthCheck() {
  try {
    const result = await executeQuery('SELECT NOW() as db_time, pg_database_size(current_database()) as db_size');
    return {
      status: 'healthy',
      database: 'connected',
      timestamp: result.rows[0].db_time,
      databaseSize: result.rows[0].db_size
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      database: 'disconnected',
      error: error.message
    };
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('🛑 SIGTERM received, closing PostgreSQL pool...');
  await closePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('🛑 SIGINT received, closing PostgreSQL pool...');
  await closePool();
  process.exit(0);
});

// Export the pool and functions
module.exports = {
  pool: () => pool,
  initializePool,
  getConnection,
  executeQuery,
  queryOne,
  getPoolStats,
  closePool,
  healthCheck,
  
  // For backward compatibility
  query: executeQuery,
  getPool: () => pool
};
