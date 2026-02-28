const db = require('../config/db');
const {
  getAllOrders: getAllOrdersQuery,
  getOrderById: getOrderByIdQuery,
  getOrdersByUserId: getOrdersByUserIdQuery,
  createOrder: createOrderQuery,
  updateOrderStatus: updateOrderStatusQuery,
  getOrderByRazorpayId: getOrderByRazorpayIdQuery
} = require('../database/orders.queries');
const { logger } = require('../utils/logger');

class Order {
  /**
   * Get orders by User ID
   */
  static async getByUserId(userId) {
    try {
      const result = await db.query(getOrdersByUserIdQuery, [userId]);
      return result.rows;
    } catch (error) {
      logger.error(`❌ Order model getByUserId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Create new order
   */
  static async create(orderData) {
    try {
      const { userId, productId, quantity, totalAmount, razorpayOrderId, status } = orderData;

      const resultRes = await db.query(createOrderQuery, [
        userId,
        productId,
        quantity || 1,
        totalAmount,
        razorpayOrderId,
        status || 'PENDING'
      ]);

      const result = resultRes.rows[0];
      logger.info(`✅ Order created in DB: ${result.id}`);
      return result;
    } catch (error) {
      logger.error(`❌ Order model create error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all orders (with customer info)
   */
  static async getAll() {
    try {
      const result = await db.query(getAllOrdersQuery);
      return result.rows;
    } catch (error) {
      logger.error(`❌ Order model getAll error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get order by ID
   */
  static async getById(id) {
    try {
      const result = await db.query(getOrderByIdQuery, [id]);
      if (!result.rows || result.rows.length === 0) {
        const error = new Error(`Order with id ${id} not found`);
        error.kind = 'not_found';
        throw error;
      }
      return result.rows[0];
    } catch (error) {
      logger.error(`❌ Order model getById error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get order by Razorpay ID
   */
  static async getByRazorpayOrderId(razorpayOrderId) {
    try {
      const result = await db.query(getOrderByRazorpayIdQuery, [razorpayOrderId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`❌ Order model getByRazorpayOrderId error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update order status
   */
  static async updateStatus(id, status) {
    try {
      const resultRes = await db.query(updateOrderStatusQuery, [status, id]);
      const result = resultRes.rows[0];

      if (!resultRes.rows || resultRes.rows.length === 0) {
        const error = new Error(`Order with id ${id} not found`);
        error.kind = 'not_found';
        throw error;
      }

      logger.info(`✅ Order ${id} status updated to ${status}`);
      return result;
    } catch (error) {
      logger.error(`❌ Order model updateStatus error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get Order Stats
   */
  static async getStats() {
    try {
      const result = await db.query(`
        SELECT 
          COUNT(*)::INTEGER as total_orders,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END), 0)::INTEGER as paid_orders,
          COALESCE(SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END), 0)::INTEGER as pending_orders,
          COALESCE(SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END), 0)::INTEGER as failed_orders,
          COALESCE(SUM(CASE WHEN status = 'PAID' THEN total_amount ELSE 0 END), 0)::NUMERIC as total_revenue
        FROM orders
      `);
      return result.rows[0];
    } catch (error) {
      logger.error(`❌ Order model getStats error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = Order;
