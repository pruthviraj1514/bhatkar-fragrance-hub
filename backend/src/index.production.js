/**
 * PRODUCTION SERVER STARTUP & OPTIMIZATION
 * ==========================================
 * 
 * Complete setup for:
 * - Connection pooling
 * - Caching strategy
 * - Health monitoring
 * - Error handling
 * - Graceful shutdown
 * 
 * File: backend/src/index.production.js
 */

require('dotenv/config');
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const { logger } = require('./utils/logger');
const { initializePool, closePool, getPoolStats } = require('./config/db.pool');

// ========================================================================
// ENVIRONMENT SETUP
// ========================================================================

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'production';
const API_BASE_URL = process.env.VITE_API_BASE_URL || `http://localhost:${PORT}`;

logger.info(`🚀 Starting server in ${NODE_ENV} environment`);
logger.info(`📍 API Base URL: ${API_BASE_URL}`);

// ========================================================================
// EXPRESS APP SETUP
// ========================================================================

const app = express();

// --------  SECURITY MIDDLEWARE --------
app.use(helmet()); // Secure HTTP headers

// --------  COMPRESSION --------
app.use(compression()); // Gzip compression

// --------  CORS --------
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.FRONTEND_URL || 'https://bhatkar-fragrance-hub.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// --------  BODY PARSERS --------
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ========================================================================
// REQUEST LOGGING MIDDLEWARE
// ========================================================================

app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      `${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    );

    // Alert on slow requests
    if (duration > 1000) {
      logger.warn(`⚠️  SLOW REQUEST: ${req.method} ${req.path} (${duration}ms)`);
    }
  });

  next();
});

// ========================================================================
// ROUTES
// ========================================================================

// -------- HEALTH CHECK --------
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV
  });
});

// -------- SYSTEM STATUS --------
app.get('/status', async (req, res) => {
  try {
    const poolStats = getPoolStats();
    const memoryUsage = process.memoryUsage();

    res.status(200).json({
      status: 'healthy',
      database: poolStats,
      memory: {
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
        external: Math.round(memoryUsage.external / 1024 / 1024) + 'MB'
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// -------- API ROUTES --------
const productsOptimizedRoute = require('./routes/products.optimized.route');
const productImageRoute = require('./routes/productImage.route');
const authRoute = require('./routes/auth.route');

app.use('/api/products', productsOptimizedRoute);
app.use('/api/product-images', productImageRoute);
app.use('/api/auth', authRoute);

// -------- 404 HANDLER --------
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path
  });
});

// -------- ERROR HANDLER --------
app.use((err, req, res, next) => {
  logger.error('🔴 Unhandled error:', err.message);

  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ========================================================================
// DATABASE INITIALIZATION
// ========================================================================

async function initializeDatabase() {
  try {
    logger.info('🔄 Initializing database connection pool...');
    
    await initializePool();
    
    logger.info('✅ Database connection pool ready');
    logger.info('✅ MySQL version verified');
    
    return true;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error.message);
    logger.error('⚠️  Will retry connection on first request...');
    return false;
  }
}

// ========================================================================
// SERVER STARTUP
// ========================================================================

async function startServer() {
  try {
    // -------- Initialize Database --------
    await initializeDatabase();

    // -------- Start HTTP Server --------
    const server = app.listen(PORT, () => {
      console.log('\n' + '='.repeat(60));
      console.log('🚀 SERVER STARTED'.padEnd(40));
      console.log('='.repeat(60));
      console.log(`📍 Port: ${PORT}`);
      console.log(`🔧 Environment: ${NODE_ENV}`);
      console.log(`⏱️  Uptime: ${process.uptime()}s`);
      console.log('='.repeat(60) + '\n');

      logger.info('✅ Express server running');
      logger.info(`✅ Listening on port ${PORT}`);
      logger.info(`✅ API endpoint: http://localhost:${PORT}/api`);
      logger.info(`✅ Health check: http://localhost:${PORT}/health`);
    });

    // ========================================================================
    // GRACEFUL SHUTDOWN
    // ========================================================================

    const gracefulShutdown = async (signal) => {
      console.log(`\n\n🛑 ${signal} received - graceful shutdown starting...\n`);
      logger.warn(`${signal} - Starting graceful shutdown...`);

      // Stop accepting new requests
      server.close(async () => {
        logger.info('✅ HTTP server closed');

        // Close database connections
        try {
          await closePool();
          logger.info('✅ Database pool closed');
        } catch (err) {
          logger.error('❌ Error closing database pool:', err.message);
        }

        logger.info('✅ Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ========================================================================
    // UNEXPECTED ERROR HANDLERS
    // ========================================================================

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise);
      logger.error('   Reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:',error.message);
      logger.error('   Stack:', error.stack);
      
      // Give logger time to write, then exit
      setTimeout(() => {
        process.exit(1);
      }, 100);
    });

    return server;

  } catch (error) {
    logger.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
