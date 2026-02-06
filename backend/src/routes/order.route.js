const router = require('express').Router();
const { asyncHandler } = require('../middlewares/asyncHandler');
const adminAuth = require('../middlewares/adminAuth');
const orderController = require('../controllers/order.controller');

// Public: get all orders (for admin UI we'll protect in front-end; keep admin route for modifications)
router.route('/').get(adminAuth, asyncHandler(orderController.getAllOrders));
router.route('/:id').get(adminAuth, asyncHandler(orderController.getOrderById));

// Update order status
router.route('/:id/status').put(adminAuth, asyncHandler(orderController.updateOrderStatus));

module.exports = router;
