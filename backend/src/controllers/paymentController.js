/**
 * Payment Controller
 * ==================
 * Handles HTTP requests for payment operations
 */

const paymentService = require('../services/paymentService');
const { logger } = require('../utils/logger');

/**
 * POST /api/payment/create-order
 * Create a new payment order
 * 
 * Accepts userId from two sources:
 * 1. JWT token via Authorization header (via optionalAuth middleware)
 * 2. Request body (as fallback)
 */
exports.createOrder = async (req, res) => {
  try {
    const { productId: rawProductId, quantity = 1, contact = null } = req.body;
    const productId = Number(rawProductId);

    // Require userId from authenticated middleware (auth)
    // Guest checkout is no longer allowed due to strict PostgreSQL foreign key constraints
    const userId = req.user?.id;
    console.log(`👤 Auth Check - User from token: ${userId || 'MISSING'}`);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: You must be logged in to create an order' });
    }

    console.log('📋 Processing create-order request:');
    console.log(`   productId: ${productId}`);
    console.log(`   userId: ${userId}`);
    console.log(`   quantity: ${quantity}`);

    // Validate inputs
    if (!productId || isNaN(productId)) {
      return res.status(400).json({ success: false, error: 'Product ID is required and must be a number' });
    }

    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({ success: false, error: 'Quantity must be between 1 and 100' });
    }

    // Create order; userId may be null for guest checkout
    const result = await paymentService.createOrder(userId, productId, quantity, contact);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('❌ Error in createOrder:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/payment/verify
 * Verify payment and update order status
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpay_payment_id, razorpay_signature } = req.body;

    // Validate inputs
    if (!orderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Order ID, Payment ID, and Signature are required'
      });
    }

    const result = await paymentService.verifyPayment(
      orderId,
      razorpay_payment_id,
      razorpay_signature
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error('❌ Error in verifyPayment:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * POST /api/payment/webhook
 * Handle Razorpay webhook events
 */
exports.webhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const payload = req.body;

    if (!signature) {
      logger.warn('⚠️ Webhook received without signature');
      return res.status(400).json({
        success: false,
        error: 'Signature header missing'
      });
    }

    const result = await paymentService.handleWebhook(payload, signature);

    return res.status(200).json(result);
  } catch (error) {
    logger.error('❌ Error in webhook handler:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/payment/order/:orderId
 * Get order details
 */
exports.getOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await paymentService.getOrderDetails(orderId);

    return res.status(200).json({
      success: true,
      order
    });
  } catch (error) {
    logger.error('❌ Error in getOrder:', error.message);
    return res.status(404).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * GET /api/payment/payment/:paymentId
 * Get payment details
 */
exports.getPayment = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await paymentService.getPaymentDetails(paymentId);

    return res.status(200).json({
      success: true,
      payment
    });
  } catch (error) {
    logger.error('❌ Error in getPayment:', error.message);
    return res.status(404).json({
      success: false,
      error: error.message
    });
  }
};
