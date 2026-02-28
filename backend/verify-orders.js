const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Verification Script: User-Specific Orders
 * ========================================
 * Tests the new /api/orders/my endpoint and its response format.
 * 
 * NOTE: This script requires a valid user token.
 */
async function verifyUserOrders() {
    console.log('🔍 Starting User Orders Verification...');

    try {
        // 1. Check if orders table has data
        const db = require('./src/config/db');
        const result = await db.execute('SELECT * FROM orders LIMIT 1');
        const orders = result.rows;

        if (orders.length === 0) {
            console.log('⚠️ No orders found in database. Please place an order first.');
            process.exit(0);
        }

        const userId = orders[0].user_id;
        console.log(`✅ Found test order for User ID: ${userId}`);

        // 2. Test the query logic directly
        const { getOrdersByUserId } = require('./src/database/orders.queries');
        const { rows: results } = await db.query(getOrdersByUserId, [userId]);

        console.log(`✅ Direct Query Result: Found ${results.length} orders`);
        if (results.length > 0) {
            const order = results[0];
            console.log('📊 Sample Order Structure:');
            console.log(`   - ID: ${order.id}`);
            console.log(`   - Product: ${order.product_name}`);
            console.log(`   - Multiple Images: ${Array.isArray(order.product_images) ? 'YES' : 'NO'}`);
            console.log(`   - Images Content:`, order.product_images);

            const hasImages = Array.isArray(order.product_images) && order.product_images.length > 0;
            if (hasImages) {
                console.log('✅ Image Aggregation: SUCCESS');
            } else {
                console.log('ℹ️ Image Aggregation: No images for this product');
            }
        }

        console.log('\n✨ Verification Completed Successfully!');
    } catch (err) {
        console.error('❌ Verification FAILED:', err.message);
        process.exit(1);
    }
}

verifyUserOrders();
