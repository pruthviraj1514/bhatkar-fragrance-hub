const mysql = require('mysql2/promise');
const { logger } = require('../utils/logger');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_PORT } = require('../utils/secrets');

const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    ssl: process.env.NODE_ENV === 'production' ? true : false
});

connection.then(() => {
    logger.info('Init connection established');
}).catch((err) => {
    logger.error(err.message);
});

module.exports = connection;