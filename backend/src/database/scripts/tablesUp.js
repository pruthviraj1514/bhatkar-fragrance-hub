const { logger } = require('../../utils/logger');
const { createTableUSers: createTableUSersQuery } = require('../queries');
const { createTableProducts: createTableProductsQuery } = require('../products.queries');
const { createTableOrders: createTableOrdersQuery } = require('../orders.queries');

(async () => {
    const pool = require('../../config/db.config');
    try {
        // Create users table
        await pool.query(createTableUSersQuery);
        logger.info('Table users created!');
        
        // Create products table
        await pool.query(createTableProductsQuery);
        logger.info('Table products created!');
        
        // Create orders table
        await pool.query(createTableOrdersQuery);
        logger.info('Table orders created!');
        
        process.exit(0);
    } catch (err) {
        logger.error('Error creating tables:', err.message);
        process.exit(1);
    }
})();
