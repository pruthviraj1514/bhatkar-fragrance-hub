require('dotenv/config');
const { logger } = require('./utils/logger');
const db = require('./config/db');
const app = require('./app');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'production';

/**
 * DATABASE INITIALIZATION
 */
async function initializeDatabase() {
  try {
    logger.info('🔄 Initializing database connection pool...');
    await db.verifyConnection();
    logger.info('✅ PostgreSQL/Supabase connection verified');
    return true;
  } catch (error) {
    logger.error('❌ Database initialization failed:', error.message);
    return false;
  }
}

/**
 * SERVER STARTUP
 */
async function startServer() {
  try {
    // Initialize Database
    await initializeDatabase();

    // Start HTTP Server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info('============================================================');
      logger.info(`🚀 SERVER STARTED IN ${NODE_ENV.toUpperCase()} MODE`);
      logger.info(`📍 Port: ${PORT}`);
      logger.info(`⏱️  Uptime: ${process.uptime()}s`);
      logger.info('============================================================');
    });

    /**
     * GRACEFUL SHUTDOWN
     */
    const gracefulShutdown = async (signal) => {
      logger.warn(`🛑 ${signal} received - starting graceful shutdown...`);

      server.close(async () => {
        logger.info('✅ HTTP server closed');
        try {
          await db.pool.end();
          logger.info('✅ Database pool closed');
        } catch (err) {
          logger.error('❌ Error closing database pool:', err.message);
        }
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

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise);
      logger.error('   Reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error.message);
      logger.error('   Stack:', error.stack);
      setTimeout(() => process.exit(1), 100);
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

module.exports = { startServer };
