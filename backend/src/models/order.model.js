const db = require('../config/db.config');
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
      const [result] = await db.query(getAllOrdersQuery);
      return result;
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async getById(id) {
    try {
      const [result] = await db.query(getOrderByIdQuery, [id]);
      if (result.length === 0) {
        const error = new Error(`Order with id ${id} not found`);
        error.kind = 'not_found';
        throw error;
      }
      return result[0];
    } catch (error) {
      logger.error(error.message);
      throw error;
    }
  }

  static async updateStatus(id, status) {
    try {
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
