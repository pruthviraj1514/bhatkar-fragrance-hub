const db = require('../config/db');  // Consolidated MySQL Pool
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
      // MySQL: result.insertId instead of result.rows[0].id
      const [result] = await db.query(createOrderQuery, [
        newOrder.customer_name,
        newOrder.customer_email,
        newOrder.total,
        newOrder.status || 'pending'
      ]);
      return { id: result.insertId, ...newOrder };
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async getAll() {
    try {
      // MySQL: [rows] instead of result.rows
      const [rows] = await db.query(getAllOrdersQuery);
      return rows;
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async getById(id) {
    try {
      // MySQL: [rows] instead of result.rows
      const [rows] = await db.query(getOrderByIdQuery, [id]);
      if (rows.length === 0) {
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
      // MySQL: result.affectedRows instead of result.rowCount
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
