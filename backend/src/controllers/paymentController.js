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
    const { items, contact = null, shippingData = null } = req.body;

    // Require userId from authenticated middleware (auth)
    const userId = req.user?.id;
    console.log(`👤 Auth Check - User from token: ${userId || 'MISSING'}`);

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized: You must be logged in to create an order' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Cart items are required' });
    }

    console.log('📋 Processing multi-item order request:', JSON.stringify(items));

    // Create order with shipping data from checkout form
    const result = await paymentService.createOrder(userId, items, contact, shippingData);

    console.log('✅ Order created successfully:', {
      orderId: result.orderId,
      razorpayOrderId: result.razorpayOrderId,
      amount: result.amount,
      currency: result.currency
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('❌ Error in createOrder:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error
    });
    logger.error('❌ Error in createOrder:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message,
      type: error.constructor.name
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

    console.log('🔍 Verifying payment:', {
      orderId,
      paymentId: razorpay_payment_id ? '✅ Set' : '❌ Missing',
      signature: razorpay_signature ? '✅ Set' : '❌ Missing'
    });

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

    console.log('✅ Payment verified successfully:', {
      orderId: result.orderId,
      paymentId: result.paymentId
    });

    // If service returned a friendly message about already-paid order, still
    // use 200 status so frontend treats it as success
    return res.status(200).json(result);
  } catch (error) {
    // if an already-paid error somehow bubbles up, transform to success response
    if (error.message && error.message.toLowerCase().includes('already paid')) {
      console.warn('Client attempted to verify an already-paid order, sending success');
      return res.status(200).json({ success: true, message: 'Order already paid' });
    }

    console.error('❌ Error in verifyPayment:', {
      message: error.message,
      stack: error.stack,
      orderId: req.body.orderId
    });
    logger.error('❌ Error in verifyPayment:', error.message);
    return res.status(400).json({
      success: false,
      error: error.message,
      type: error.constructor.name
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
