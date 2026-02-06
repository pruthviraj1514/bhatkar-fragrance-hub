const Order = require('../models/order.model');
const { logger } = require('../utils/logger');

// Get all orders
exports.getAllOrders = async (req, res) => {
  try {
    const data = await Order.getAll();
    return res.status(200).send({ status: 'success', data: data });
  } catch (error) {
    logger.error(`Get all orders error: ${error.message}`);
    return res.status(500).send({ status: 'error', message: 'Error retrieving orders' });
  }
};

// Get order by id
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await Order.getById(id);
    return res.status(200).send({ status: 'success', data });
  } catch (error) {
    if (error.kind === 'not_found') {
      logger.error(`Order not found: ${error.message}`);
      return res.status(404).send({ status: 'error', message: error.message });
    }
    logger.error(`Get order error: ${error.message}`);
    return res.status(500).send({ status: 'error', message: 'Error retrieving order' });
  }
};

// Update order status (admin)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) {
      return res.status(400).send({ status: 'error', message: 'Status is required' });
    }
    const data = await Order.updateStatus(id, status);
    return res.status(200).send({ status: 'success', message: 'Order updated', data });
  } catch (error) {
    if (error.kind === 'not_found') {
      logger.error(`Order not found: ${error.message}`);
      return res.status(404).send({ status: 'error', message: error.message });
    }
    logger.error(`Update order error: ${error.message}`);
    return res.status(500).send({ status: 'error', message: 'Error updating order' });
  }
};
