const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = require('../utils/secrets');

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
    ssl: process.env.NODE_ENV === 'production' ? true : false
});

// Log pool creation
pool.getConnection().then(() => {
    logger.info('Database pool created successfully');
}).catch((err) => {
    logger.error('Database pool creation failed:', err.message);
    process.exit(1);
});

module.exports = pool;