/**
 * Migration: add shipping fields to orders table
 * Adds: phone, shipping_address, shipping_city, shipping_pincode, shipping_state, shipping_phone
 */
module.exports = {
  up: async (db) => {
    const alter = `ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
      ADD COLUMN IF NOT EXISTS shipping_address TEXT,
      ADD COLUMN IF NOT EXISTS shipping_city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS shipping_pincode VARCHAR(10),
      ADD COLUMN IF NOT EXISTS shipping_state VARCHAR(100),
      ADD COLUMN IF NOT EXISTS shipping_phone VARCHAR(20);
    `;
    try {
      await db.query(alter);
      return true;
    } catch (err) {
      console.error('Migration 005 failed:', err.message);
      throw err;
    }
  },

  down: async (db) => {
    const alter = `ALTER TABLE orders
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS shipping_address,
      DROP COLUMN IF EXISTS shipping_city,
      DROP COLUMN IF EXISTS shipping_pincode,
      DROP COLUMN IF EXISTS shipping_state,
      DROP COLUMN IF EXISTS shipping_phone;
    `;
    try {
      await db.query(alter);
      return true;
    } catch (err) {
      console.error('Rollback 005 failed:', err.message);
      throw err;
    }
  }
};
