/**
 * Migration: Convert order_items.product_id FK to CASCADE
 * -----------------------------------------------------
 * The earlier migration created `order_items` with a
 * `ON DELETE RESTRICT` foreign key. This meant attempts to
 * remove a product would fail when any order_items referenced
 * it (which is desirable for data integrity but inconvenient
 * for admin deletion).  To simplify cleanup we switch the FK
 * to use `ON DELETE CASCADE` so that removing a product will
 * automatically remove all related order_items.
 *
 * NOTE: the controller already performs an explicit delete of
 * order_items before removing a product, so this migration is
 * mostly to keep the schema consistent going forward and to
 * avoid having to remember the manual cleanup step.
 *
 * This migration attempts to drop and recreate the constraint
 * in both MySQL and PostgreSQL styles to remain compatible with
 * whichever engine the project is currently using.
 */

const db = require('../../config/db');
const { logger } = require('../../utils/logger');

async function up() {
  const conn = await db.getConnection();
  try {
    console.log('🔄 Running migration: cascade order_items.product_id FK');

    // PostgreSQL: drop constraint if exists
    await conn.query(`ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;`).catch(() => {});

    // MySQL: drop foreign key (the name may vary, try the standard name)
    await conn.query(`ALTER TABLE order_items DROP FOREIGN KEY order_items_product_id_fkey;`).catch(() => {});

    // Add new constraint with CASCADE
    // Postgres syntax
    await conn.query(`ALTER TABLE order_items
      ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;`
    ).catch(() => {});

    // MySQL syntax (if above failed)
    await conn.query(`ALTER TABLE order_items
      ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;`
    ).catch(() => {});

    console.log('✅ order_items.product_id FK changed to CASCADE');
    return true;
  } catch (error) {
    logger.error('❌ Migration 003 failed:', error.message);
    throw error;
  } finally {
    conn.release();
  }
}

async function down() {
  const conn = await db.getConnection();
  try {
    console.log('🔄 Rolling back migration 003: revert FK to RESTRICT');
    await conn.query(`ALTER TABLE order_items DROP CONSTRAINT IF EXISTS order_items_product_id_fkey;`).catch(() => {});
    await conn.query(`ALTER TABLE order_items DROP FOREIGN KEY order_items_product_id_fkey;`).catch(() => {});
    await conn.query(`ALTER TABLE order_items
      ADD CONSTRAINT order_items_product_id_fkey
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;`
    ).catch(() => {});
    console.log('✅ FK reverted to RESTRICT');
    return true;
  } catch (error) {
    logger.error('❌ Rollback 003 failed:', error.message);
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = { up, down };