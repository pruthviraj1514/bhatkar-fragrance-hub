/**
 * FINAL VERIFICATION SCRIPT
 * =========================
 * Quick sanity check for the entire fragrance hub platform.
 */

const db = require('./src/config/db');

async function verify() {
    console.log('🏁 Running Final Sanity Checks...');

    try {
        const stats = {};

        // 1. Data Counts
        const { rows: products } = await db.query('SELECT COUNT(*) as count FROM products');
        const { rows: orders } = await db.query('SELECT COUNT(*) as count FROM orders');
        const { rows: users } = await db.query('SELECT COUNT(*) as count FROM users');
        const { rows: reviews } = await db.query('SELECT COUNT(*) as count FROM reviews');

        stats.products = products[0].count;
        stats.orders = orders[0].count;
        stats.users = users[0].count;
        stats.reviews = reviews[0].count;

        console.table(stats);

        // 2. Check for inconsistent data structures (null images)
        const { rows: nullImages } = await db.query(`
            SELECT COUNT(*) as count 
            FROM products p 
            WHERE NOT EXISTS (SELECT 1 FROM product_images pi WHERE pi.product_id = p.id)
        `);
        console.log(`ℹ️ Products without images: ${nullImages[0].count}`);

        // 3. Database URL masking (security check)
        const dbUrl = process.env.DATABASE_URL || '';
        const masked = dbUrl.replace(/:([^@]+)@/, ':****@');
        console.log(`🔗 Connected to: ${masked}`);

        console.log('\n✅ All systems nominal.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Verification failed:', e.message);
        process.exit(1);
    }
}

verify();
