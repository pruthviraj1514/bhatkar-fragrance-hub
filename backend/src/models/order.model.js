const db = require('../config/db');  // Consolidated PostgreSQL/Supabase Pool
const {
  getAllOrders: getAllOrdersQuery,
  getOrderById: getOrderByIdQuery,
  createOrder: createOrderQuery,
  updateOrderStatus: updateOrderStatusQuery
} = require('../database/orders.queries');
const { logger } = require('../utils/logger');

class Order {
  constructor(customer_name, customer_email, total, status) {
    this.customer_name = customer_name;
    this.customer_email = customer_email;
    this.total = total;
    this.status = status || 'pending';
  }

  static async create(newOrder) {
    try {
      // Create order entry in PostgreSQL
      // The query uses RETURNING * so it returns the row
      const [rows] = await db.query(createOrderQuery, [
        newOrder.customer_name,
        newOrder.customer_email,
        newOrder.total,
        newOrder.status || 'pending'
      ]);
      const result = rows[0] || rows;
      return { id: result.id, ...newOrder };
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async getAll() {
    try {
      // Fetch all orders
      const [rows] = await db.query(getAllOrdersQuery);
      return rows;
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async getById(id) {
    try {
      // Fetch order by ID
      const [rows] = await db.query(getOrderByIdQuery, [id]);
      if (!rows || rows.length === 0) {
        const error = new Error(`Order with id ${id} not found`);
        error.kind = 'not_found';
        throw error;
      }
      return rows[0];
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
      // Update status in PostgreSQL
      const [result] = await db.query(updateOrderStatusQuery, [status, id]);
      if (result.affectedRows === 0) {
        const error = new Error(`Order with id ${id} not found`);
        error.kind = 'not_found';
        throw error;
      }
      return { id, status };
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }
}

module.exports = Order;
