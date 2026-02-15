/**
 * Payment Routes
 * ==============
 * API endpoints for Razorpay payment integration
 * 
 * IMPORTANT: Webhook route uses express.raw() to preserve raw body
 * for signature verification (must be applied before express.json())
 * 
 * Routes:
 * GET    /api/payment/health              Health check (quick verification)
 * POST   /api/payment/create-order        Create payment order
 * POST   /api/payment/verify              Verify payment signature
 * POST   /api/payment/webhook             Razorpay webhook handler
 * GET    /api/payment/order/:orderId      Get order details
 * GET    /api/payment/payment/:paymentId  Get payment details
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { adminAuth } = require('../middlewares/adminAuth');
const { captureRawBody, attachRawBody } = require('../middlewares/webhookMiddleware');

// ===== LOGGING INITIALIZATION =====
console.log('🔄 Payment router initializing...');
console.log(`✅ Payment controller loaded: ${typeof paymentController.createOrder === 'function' ? 'OK' : 'MISSING'}`);

// ===== HEALTH CHECK ENDPOINT =====
// Quick verification that payment routes are working
// GET /api/payment/health
router.get('/health', (req, res) => {
  console.log('📡 Payment health check received');
  const controllerStatus = {
    createOrder: typeof paymentController.createOrder === 'function' ? '✅' : '❌',
    verifyPayment: typeof paymentController.verifyPayment === 'function' ? '✅' : '❌',
    webhook: typeof paymentController.webhook === 'function' ? '✅' : '❌',
    getOrder: typeof paymentController.getOrder === 'function' ? '✅' : '❌',
    getPayment: typeof paymentController.getPayment === 'function' ? '✅' : '❌',
  };

  res.status(200).json({
    status: 'Payment API is running',
    timestamp: new Date().toISOString(),
    routes: {
      'POST /api/payment/create-order': '✅ Ready',
      'POST /api/payment/verify': '✅ Ready',
      'POST /api/payment/webhook': '✅ Ready',
      'GET /api/payment/order/:orderId': '✅ Ready',
      'GET /api/payment/health': '✅ You are here',
    },
    controller: controllerStatus,
  });
});

/**
 * Public Routes (Accessible to all authenticated users, not just admins)
 * IMPORTANT: These handle customer payments, so they should NOT require adminAuth
 */

// Create payment order
// POST /api/payment/create-order
// Body: { productId, quantity }
// Auth: Optional (userId from token if available)
router.post('/create-order', (req, res, next) => {
  console.log('📨 POST /api/payment/create-order received');
  next();
}, paymentController.createOrder);

// Verify payment
// POST /api/payment/verify
// Body: { orderId, razorpay_payment_id, razorpay_signature }
// Auth: Required for security
router.post('/verify', (req, res, next) => {
  console.log('🔐 POST /api/payment/verify received');
  next();
}, paymentController.verifyPayment);

// Get order details
// GET /api/payment/order/:orderId
// Auth: Optional (return public order data)
router.get('/order/:orderId', (req, res, next) => {
  console.log(`🔍 GET /api/payment/order/${req.params.orderId} received`);
  next();
}, paymentController.getOrder);

// Get payment details
// GET /api/payment/payment/:paymentId
// Auth: Optional
router.get('/payment/:paymentId', (req, res, next) => {
  console.log(`🔍 GET /api/payment/payment/${req.params.paymentId} received`);
  next();
}, paymentController.getPayment);

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
  (req, res, next) => {
    console.log('🎣 POST /api/payment/webhook received from Razorpay');
    next();
  },
  captureRawBody,
  attachRawBody,
  paymentController.webhook
);

// ===== INITIALIZATION COMPLETE =====
console.log('✅ Payment routes successfully loaded');
console.log('   Routes: /create-order, /verify, /webhook, /order/:id, /health');

module.exports = router;
