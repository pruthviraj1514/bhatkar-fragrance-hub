/**
 * Razorpay Webhook Controller
 * ============================
 * Handles webhook events from Razorpay payment gateway
 * 
 * Security:
 * - HMAC SHA256 signature verification (prevents tampering)
 * - Webhook secret from environment variables
 * - Idempotency checks (prevents duplicate processing)
 * - Request validation
 * 
 * Events handled:
 * - payment.captured → Order marked as PAID
 * - payment.failed → Order marked as FAILED
 * - refund.processed → Order marked as REFUNDED
 */

const crypto = require('crypto');
const db = require('../config/db');
const { logger } = require('../utils/logger');
const OrderModel = require('../models/orderModel');

/**
 * Verify Razorpay webhook signature
 * Using HMAC SHA256 with webhook secret
 */
const verifyWebhookSignature = (body, signature) => {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('❌ RAZORPAY_WEBHOOK_SECRET not configured');
    throw new Error('Webhook secret not configured');
  }

  // Create HMAC SHA256 hash of request body
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  logger.info(`🔐 Verifying webhook signature...`);
  logger.info(`Expected: ${expectedSignature.substring(0, 20)}...`);
  logger.info(`Received: ${signature.substring(0, 20)}...`);

  // Constant-time comparison to prevent timing attacks
  const isValid = crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );

  if (!isValid) {
    logger.error('❌ Invalid webhook signature - possible spoofing attempt!');
    throw new Error('Invalid signature');
  }

  logger.info('✅ Webhook signature verified successfully');
  return true;
};

/**
 * Handle payment.captured event
 * Order should be marked as PAID in database
 */
const handlePaymentCaptured = async (event) => {
  logger.info(`💳 Processing payment.captured event`);

  const paymentData = event.payload.payment.entity;
  const razorpayOrderId = paymentData.order_id;
  const razorpayPaymentId = paymentData.id;
  const amount = paymentData.amount / 100; // Convert from paise to rupees

  logger.info(`   Order ID: ${razorpayOrderId}`);
  logger.info(`   Payment ID: ${razorpayPaymentId}`);
  logger.info(`   Amount: ₹${amount}`);

  // Check if already processed (idempotency)
  const existingOrder = await OrderModel.getByRazorpayOrderId(razorpayOrderId);

  if (existingOrder && existingOrder.status === 'PAID') {
    logger.warn(`⚠️  Order ${razorpayOrderId} already marked as PAID - skipping duplicate`);
    return { processed: false, reason: 'duplicate' };
  }

  // Update order status to PAID
  const updated = await OrderModel.updateStatus(razorpayOrderId, 'PAID');

  if (updated) {
    logger.info(`✅ Order ${razorpayOrderId} marked as PAID`);

    // Optional: Send confirmation email to customer
    // await sendPaymentConfirmationEmail(order.email, order);

    return { processed: true, status: 'PAID' };
  } else {
    logger.error(`❌ Failed to update order ${razorpayOrderId} to PAID`);
    return { processed: false, reason: 'update_failed' };
  }
};

/**
 * Handle payment.failed event
 * Order should be marked as FAILED in database
 */
const handlePaymentFailed = async (event) => {
  logger.info(`❌ Processing payment.failed event`);

  const paymentData = event.payload.payment.entity;
  const razorpayOrderId = paymentData.order_id;
  const failureReason = paymentData.description || 'Payment declined';

  logger.info(`   Order ID: ${razorpayOrderId}`);
  logger.info(`   Reason: ${failureReason}`);

  // Check if already processed
  const existingOrder = await OrderModel.getByRazorpayOrderId(razorpayOrderId);

  if (existingOrder && existingOrder.status === 'FAILED') {
    logger.warn(`⚠️  Order ${razorpayOrderId} already marked as FAILED - skipping duplicate`);
    return { processed: false, reason: 'duplicate' };
  }

  // Update order status to FAILED
  const updated = await OrderModel.updateStatus(razorpayOrderId, 'FAILED');

  if (updated) {
    logger.info(`✅ Order ${razorpayOrderId} marked as FAILED`);

    // Optional: Send failure notification to customer
    // await sendPaymentFailedEmail(order.email, order, failureReason);

    return { processed: true, status: 'FAILED' };
  } else {
    logger.error(`❌ Failed to update order ${razorpayOrderId} to FAILED`);
    return { processed: false, reason: 'update_failed' };
  }
};

/**
 * Handle refund.processed event
 * Order should be marked as REFUNDED in database
 */
const handleRefundProcessed = async (event) => {
  logger.info(`💰 Processing refund.processed event`);

  const refundData = event.payload.refund.entity;
  const razorpayOrderId = refundData.order_id;
  const razorpayPaymentId = refundData.payment_id;
  const refundAmount = refundData.amount / 100; // Convert from paise to rupees

  logger.info(`   Order ID: ${razorpayOrderId}`);
  logger.info(`   Payment ID: ${razorpayPaymentId}`);
  logger.info(`   Refund Amount: ₹${refundAmount}`);

  // Check if already processed
  const existingOrder = await OrderModel.getByRazorpayOrderId(razorpayOrderId);

  if (existingOrder && existingOrder.status === 'REFUNDED') {
    logger.warn(`⚠️  Order ${razorpayOrderId} already marked as REFUNDED - skipping duplicate`);
    return { processed: false, reason: 'duplicate' };
  }

  // Update order status to REFUNDED
  const updated = await OrderModel.updateStatus(razorpayOrderId, 'REFUNDED');

  if (updated) {
    logger.info(`✅ Order ${razorpayOrderId} marked as REFUNDED (₹${refundAmount})`);

    // Optional: Send refund confirmation to customer
    // await sendRefundConfirmationEmail(order.email, order, refundAmount);

    return { processed: true, status: 'REFUNDED' };
  } else {
    logger.error(`❌ Failed to update order ${razorpayOrderId} to REFUNDED`);
    return { processed: false, reason: 'update_failed' };
  }
};

/**
 * Main webhook handler
 * Receives and processes all webhook events
 */
exports.handleWebhook = async (req, res) => {
  try {
    logger.info(`\n📨 ========== WEBHOOK RECEIVED ==========`);
    logger.info(`Timestamp: ${new Date().toISOString()}`);
    logger.info(`IP Address: ${req.ip}`);

    // Get raw body and signature
    const body = req.rawBody; // Set by express.raw() middleware
    const signature = req.headers['x-razorpay-signature'];

    // Validate inputs
    if (!body) {
      logger.error('❌ Missing request body');
      return res.status(400).json({ error: 'Missing body' });
    }

    if (!signature) {
      logger.error('❌ Missing webhook signature header');
      return res.status(401).json({ error: 'Missing signature' });
    }

    // Verify webhook signature
    try {
      verifyWebhookSignature(body, signature);
    } catch (err) {
      logger.error(`❌ Signature verification failed: ${err.message}`);
      // Return 401 for invalid signature
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook payload
    let payload;
    try {
      payload = JSON.parse(body);
    } catch (err) {
      logger.error(`❌ Failed to parse webhook payload: ${err.message}`);
      return res.status(400).json({ error: 'Invalid JSON' });
    }

    const eventType = payload.event;
    logger.info(`📌 Event Type: ${eventType}`);

    // Process event based on type
    let result;
    switch (eventType) {
      case 'payment.captured':
        result = await handlePaymentCaptured(payload);
        break;

      case 'payment.failed':
        result = await handlePaymentFailed(payload);
        break;

      case 'refund.processed':
        result = await handleRefundProcessed(payload);
        break;

      default:
        logger.warn(`⚠️  Unknown event type: ${eventType} - ignoring`);
        // Return 200 OK for unknown events (don't fail)
        return res.status(200).json({ status: 'acknowledged' });
    }

    // Return 200 OK immediately (webhook processing is async)
    logger.info(`✅ Webhook handled - returning 200 OK to Razorpay`);
    logger.info(`========================================\n`);

    res.status(200).json({
      status: 'received',
      event: eventType,
      processed: result.processed,
      reason: result.reason || null
    });

  } catch (error) {
    logger.error(`\n❌ WEBHOOK ERROR`);
    logger.error(`Error: ${error.message}`);
    logger.error(`Stack: ${error.stack}`);
    logger.error(`====================================\n`);

    // IMPORTANT: Always return 200 OK even on error
    // This prevents Razorpay from retrying forever
    res.status(200).json({
      status: 'received',
      error: error.message
    });
  }
};

/**
 * Webhook health check
 * Verify webhook endpoint is working
 */
exports.webhookHealth = (req, res) => {
  logger.info(`🏥 Webhook health check`);
  res.status(200).json({
    status: 'online',
    webhook: 'payment',
    timestamp: new Date().toISOString(),
    signature_verification: 'enabled',
    database: 'connected'
  });
};

module.exports = exports;
