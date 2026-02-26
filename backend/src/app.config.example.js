/**
 * APP.JS CONFIGURATION - Payment Route Setup
 * ===========================================
 * 
 * Critical Setup Instructions:
 * 1. Raw body parsing for webhook signature verification
 * 2. Payment routes registered before auth middleware
 * 3. CORS configured for payment endpoints
 * 4. Error handling for async payment operations
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { logger } = require('./utils/logger');

dotenv.config();
const app = express();

// ===== CRITICAL: Raw Body Parsing for Webhook =====
// Razorpay signature verification requires RAW request body
// This MUST come before JSON parsing to preserve body for hashing
app.use(express.raw({ type: 'application/json' }));

// ===== Standard Middleware =====
app.use(express.json());
app.use(cors());
app.use(express.urlencoded({ extended: true }));

// ===== Payment Routes (BEFORE Auth Middleware) =====
// These are public endpoints - no authentication required
// Routes: /create-order, /verify, /webhook, /order/:id
const paymentRoutes = require('./routes/payment.routes');
app.use('/api/payment', paymentRoutes);

// ===== Auth Routes =====
const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

// ===== Protected Routes (Auth Required) =====
// All routes after this require valid JWT token
const { verifyToken } = require('./middleware/auth');
app.use(verifyToken);

// Protected routes here...
const userRoutes = require('./routes/user.routes');
const productRoutes = require('./routes/product.routes');
const cartRoutes = require('./routes/cart.routes');
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);

// ===== Error Handling =====
app.use((error, req, res, next) => {
  logger.error(`❌ Server error: ${error.message}`);

  // Webhook errors should always return 200
  if (req.path.includes('/payment/webhook')) {
    return res.status(200).json({
      status: 'error',
      message: 'Webhook processing failed',
    });
  }

  res.status(500).json({
    status: 'error',
    message: error.message || 'Internal server error',
  });
});

// ===== Server Startup =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✨ Server running on port ${PORT}`);
  console.log(`✅ Payment endpoints ready at /api/payment`);
});

module.exports = app;
