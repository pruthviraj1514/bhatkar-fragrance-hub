const app = require('./app');
const { logger } = require('./utils/logger');
const db = require('./config/db');  // Consolidated MySQL Pool

const PORT = process.env.PORT || 5000;

// Basic sanity check can be added here if needed

const server = app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`Running on PORT ${PORT}`);

    logger.info('✓ MySQL connection pool is ready to use');
});

// Handle server errors (e.g., port already in use)
server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        logger.error(`❌ Port ${PORT} is already in use. Another process is listening on this port.`);
        logger.error('Tip: run `Get-NetTCPConnection -LocalPort 3000` on PowerShell to find the process, then stop it.');
        // Exit gracefully with non-zero code so supervisors know it failed
        process.exit(1);
    }
    logger.error('Server encountered an unexpected error:', err && err.message ? err.message : err);
    process.exit(1);
});

// Catch unhandled rejections & uncaught exceptions to avoid crashing without logs
process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Promise Rejection:', reason && reason.stack ? reason.stack : reason);
});

process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', err && err.stack ? err.stack : err);
    process.exit(1);
});
