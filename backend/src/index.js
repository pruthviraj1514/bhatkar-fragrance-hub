const app = require('./app');
const { logger } = require('./utils/logger');
const db = require('./config/db.config');

const PORT = process.env.PORT || 3000;

// Run migrations before starting the server
async function runMigrations() {
    try {
        // Check if quantity_ml column exists
        const checkColumnsQuery = `
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME IN ('quantity_ml', 'quantity_unit')
        `;
        
        const [existingColumns] = await db.query(checkColumnsQuery);
        
        if (existingColumns.length === 2) {
            logger.info('✓ Database schema is up to date');
            return;
        }

        // Add missing columns
        if (!existingColumns.find(col => col.COLUMN_NAME === 'quantity_ml')) {
            logger.info('🔄 Adding quantity_ml column...');
            await db.query(`ALTER TABLE products ADD COLUMN quantity_ml INT DEFAULT 100 AFTER price`);
            logger.info('✓ Added quantity_ml column');
        }

        if (!existingColumns.find(col => col.COLUMN_NAME === 'quantity_unit')) {
            logger.info('🔄 Adding quantity_unit column...');
            await db.query(`ALTER TABLE products ADD COLUMN quantity_unit VARCHAR(10) DEFAULT 'ml' AFTER quantity_ml`);
            logger.info('✓ Added quantity_unit column');
        }

    } catch (error) {
        logger.warn(`Migration check failed: ${error.message}. This may be normal if the database is not ready yet.`);
    }
}

app.listen(PORT, '0.0.0.0', async () => {
    logger.info(`Running on PORT ${PORT}`);
    // Run migrations after server starts
    await runMigrations();
});
