/**
 * Order Model
 * ===========
 * Database operations for orders
 */

const db = require('../config/db');
const { logger } = require('../utils/logger');

class OrderModel {
  /**
   * Create new order
   */
  static async create(orderData) {
    try {
      const { userId, productId, quantity, totalAmount, razorpayOrderId } = orderData;

      const [result] = await db.execute(
        `INSERT INTO orders (user_id, product_id, quantity, total_amount, razorpay_order_id, status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [userId, productId, quantity, totalAmount, razorpayOrderId, 'PENDING']
      );

      const id = result.id || result.insertId;
      logger.info(`✅ Order created: ${id}`);
      return id;
    } catch (error) {
      logger.error('❌ Error creating order:', error.message);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getById(orderId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM orders WHERE id = $1',
        [orderId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('❌ Error fetching order:', error.message);
      throw error;
    }
  }

  /**
   * Get order by Razorpay Order ID
   */
  static async getByRazorpayOrderId(razorpayOrderId) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM orders WHERE razorpay_order_id = $1',
        [razorpayOrderId]
      );

      return rows[0] || null;
    } catch (error) {
      logger.error('❌ Error fetching order by Razorpay ID:', error.message);
      throw error;
    }
  }

  /**
   * Get all orders by user ID
   */
  static async getByUserId(userId, limit = 50, offset = 0) {
    try {
      const [rows] = await db.execute(
        'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
        [userId, limit, offset]
      );

      return rows;
    } catch (error) {
      logger.error('❌ Error fetching user orders:', error.message);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateStatus(orderId, status) {
    try {
      const [result] = await db.execute(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, orderId]
      );

      logger.info(`✅ Order status updated: ${orderId} -> ${status}`);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('❌ Error updating order status:', error.message);
      throw error;
    }
  }

  /**
   * Get order statistics
   */
  static async getStats() {
    try {
      const [rows] = await db.execute(
        `SELECT 
          COUNT(*) as total_orders,
          SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_orders,
          SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
          SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_orders,
          SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END) as total_revenue
        FROM orders`
      );

      return rows[0];
    } catch (error) {
      logger.error('❌ Error fetching order stats:', error.message);
      throw error;
    }
  }
}

module.exports = OrderModel;
