const db = require('../../config/db.config');
const { logger } = require('../../utils/logger');

async function migrateMlPricing() {
    try {
        logger.info('Starting migration: Add quantity_ml and quantity_unit to products table');

        // Check if columns exist
        const checkColumnsQuery = `
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_NAME = 'products' AND TABLE_SCHEMA = DATABASE() 
            AND COLUMN_NAME IN ('quantity_ml', 'quantity_unit')
        `;
        
        const [existingColumns] = await db.query(checkColumnsQuery);
        
        if (existingColumns.length === 2) {
            logger.info('✓ Columns quantity_ml and quantity_unit already exist. Skipping migration.');
            return;
        }

        // Add quantity_ml column if not exists
        if (!existingColumns.find(col => col.COLUMN_NAME === 'quantity_ml')) {
            logger.info('Adding column: quantity_ml');
            const addQuantityMlQuery = `
                ALTER TABLE products 
                ADD COLUMN quantity_ml INT DEFAULT 100 
                AFTER price
            `;
            await db.query(addQuantityMlQuery);
            logger.info('✓ Column quantity_ml added successfully');
        }

        // Add quantity_unit column if not exists
        if (!existingColumns.find(col => col.COLUMN_NAME === 'quantity_unit')) {
            logger.info('Adding column: quantity_unit');
            const addQuantityUnitQuery = `
                ALTER TABLE products 
                ADD COLUMN quantity_unit VARCHAR(10) DEFAULT 'ml' 
                AFTER quantity_ml
            `;
            await db.query(addQuantityUnitQuery);
            logger.info('✓ Column quantity_unit added successfully');
        }

        logger.info('✅ Migration completed successfully');
        process.exit(0);

    } catch (error) {
        logger.error(`Migration failed: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

migrateMlPricing();
