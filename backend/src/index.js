const app = require('./app');
const { logger } = require('./utils/logger');
const db = require('./config/db');
const { runStartupMigrations } = require('./database/startupMigrations');

const PORT = process.env.PORT || 5000;

/**
 * SERVER STARTUP
 */
async function startServer() {
    try {
        // Verify database connection
        await db.verifyConnection();

        // Run startup migrations (add columns, indexes, etc.)
        await runStartupMigrations(db, logger);

        const server = app.listen(PORT, '0.0.0.0', () => {
            logger.info('============================================================');
            logger.info(`🚀 SERVER STARTED ON PORT ${PORT}`);
            logger.info(`⏱️  Uptime: ${process.uptime()}s`);
            logger.info('============================================================');
        });

        // Handle server errors
        server.on('error', (err) => {
            if (err && err.code === 'EADDRINUSE') {
                logger.error(`❌ Port ${PORT} is already in use.`);
                process.exit(1);
            }
            logger.error('Server encountered an unexpected error:', err.message);
            process.exit(1);
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
