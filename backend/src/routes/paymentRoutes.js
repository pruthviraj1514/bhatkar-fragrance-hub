/**
 * Payment Routes
 * ==============
 * API endpoints for Razorpay payment integration
 * 
 * IMPORTANT: Webhook route uses express.raw() to preserve raw body
 * for signature verification (must be applied before express.json())
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { adminAuth } = require('../middlewares/adminAuth');
const { captureRawBody, attachRawBody } = require('../middlewares/webhookMiddleware');

/**
 * Public Routes
 */

// Create payment order
// POST /api/payment/create-order
// Body: { productId, quantity }
router.post('/create-order', adminAuth, paymentController.createOrder);

// Verify payment
// POST /api/payment/verify
// Body: { orderId, razorpay_payment_id, razorpay_signature }
router.post('/verify', adminAuth, paymentController.verifyPayment);

// Get order details
// GET /api/payment/order/:orderId
router.get('/order/:orderId', adminAuth, paymentController.getOrder);

// Get payment details
// GET /api/payment/payment/:paymentId
router.get('/payment/:paymentId', adminAuth, paymentController.getPayment);

/**
 * Webhook Routes (No Auth Required - Razorpay signature validates)
 * 
 * CRITICAL: express.raw() MUST be applied here to preserve raw body
 * This is required for HMAC SHA256 signature verification
 * The signature is calculated from the raw request body, not parsed JSON
 */

// Razorpay webhook
// POST /api/payment/webhook
// Headers: x-razorpay-signature
router.post(
  '/webhook',
  captureRawBody,
  attachRawBody,
  paymentController.webhook
);

module.exports = router;
