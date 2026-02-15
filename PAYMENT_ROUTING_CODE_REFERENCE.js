/**
 * PAYMENT ROUTING FIX - QUICK CODE REFERENCE
 * ==========================================
 * 
 * Copy-paste ready code for fixing payment routes
 */

// ========================================
// FILE 1: backend/src/app.js (CORRECTED)
// ========================================

const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

// Import all routes
const authRoute = require("./routes/auth.route");
const adminRoute = require("./routes/admin.route");
const productRoute = require("./routes/product.route");
const variantRoute = require("./routes/variants.route");
const reviewsRoute = require("./routes/reviews.route");
const orderRoute = require("./routes/order.route");
const uploadRoute = require("./routes/upload.route");
const imageRoute = require("./routes/image.route");
const paymentRoute = require("./routes/paymentRoutes");  // ✅ CORRECT: Uses paymentRoutes.js

const { httpLogStream } = require("./utils/logger");

const app = express();

// ===== CRITICAL: CORS MUST BE FIRST =====
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Max-Age", "3600");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: "*",
  credentials: false,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(morgan("dev"));
app.use(morgan("combined", { stream: httpLogStream }));

// ===== HEALTH CHECK =====
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Backend API is running with CORS enabled",
  });
});

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API working fine"
    }
  });
});

// ===== DEBUG MIDDLEWARE - Log all incoming requests =====
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`);
  next();
});

// ===== API ROUTES =====
console.log('\n🚀 REGISTERING API ROUTES:');
console.log('   ✅ POST /api/auth/* → authRoute');
app.use("/api/auth", authRoute);

console.log('   ✅ POST /api/admin/* → adminRoute');
app.use("/api/admin", adminRoute);

console.log('   ✅ GET /api/products/* → productRoute');
app.use("/api/products", productRoute);

console.log('   ✅ GET /api/variants/* → variantRoute');
app.use("/api/variants", variantRoute);

console.log('   ✅ GET /api/reviews/* → reviewsRoute');
app.use("/api/reviews", reviewsRoute);

console.log('   ✅ POST /api/orders/* → orderRoute');
app.use("/api/orders", orderRoute);

console.log('   ✅ POST /api/upload-image/* → uploadRoute');
app.use("/api/upload-image", uploadRoute);

console.log('   ✅ GET /api/images/* → imageRoute');
app.use("/api/images", imageRoute);

console.log('   ✅ POST /api/payment/* → paymentRoute');
console.log(`       ├─ GET /health → Payment health check`);
console.log(`       ├─ POST /create-order → Create payment order`);
console.log(`       ├─ POST /verify → Verify payment`);
console.log(`       ├─ POST /webhook → Razorpay webhook`);
console.log(`       ├─ GET /order/:orderId → Get order`);
console.log(`       └─ GET /payment/:paymentId → Get payment`);
app.use("/api/payment", paymentRoute);

console.log('\n✨ All routes registered successfully!\n');

// ===== 404 HANDLER =====
app.use((req, res) => {
  console.error(`❌ 404 ERROR: ${req.method} ${req.path} not found`);
  
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    hint: "Try GET /api/payment/health to verify payment routes are loaded",
    timestamp: new Date().toISOString(),
    availablePaymentRoutes: [
      'GET /api/payment/health',
      'POST /api/payment/create-order',
      'POST /api/payment/verify',
    ]
  });
});

// ===== ERROR HANDLER =====
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.statusCode || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    timestamp: new Date().toISOString()
  });
});

module.exports = app;

// ========================================
// FILE 2: backend/src/routes/paymentRoutes.js (CORRECTED)
// ========================================

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { adminAuth } = require('../middlewares/adminAuth');
const { captureRawBody, attachRawBody } = require('../middlewares/webhookMiddleware');

// ===== LOGGING INITIALIZATION =====
console.log('🔄 Payment router initializing...');
console.log(`✅ Payment controller loaded: ${typeof paymentController.createOrder === 'function' ? 'OK' : 'MISSING'}`);

// ===== HEALTH CHECK ENDPOINT =====
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

// ===== PAYMENT ROUTES =====

router.post('/create-order', (req, res, next) => {
  console.log('📨 POST /api/payment/create-order received');
  next();
}, paymentController.createOrder);

router.post('/verify', (req, res, next) => {
  console.log('🔐 POST /api/payment/verify received');
  next();
}, paymentController.verifyPayment);

router.get('/order/:orderId', (req, res, next) => {
  console.log(`🔍 GET /api/payment/order/${req.params.orderId} received`);
  next();
}, paymentController.getOrder);

router.get('/payment/:paymentId', (req, res, next) => {
  console.log(`🔍 GET /api/payment/payment/${req.params.paymentId} received`);
  next();
}, paymentController.getPayment);

// ===== WEBHOOK ROUTE =====
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

console.log('✅ Payment routes successfully loaded');
console.log('   Routes: /create-order, /verify, /webhook, /order/:id, /health');

module.exports = router;

// ========================================
// FILE 3: backend/src/controllers/paymentController.js (EXAMPLE)
// ========================================

const paymentService = require('../services/paymentService');
const { logger } = require('../utils/logger');

/**
 * POST /api/payment/create-order
 */
exports.createOrder = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user?.id;

    if (!productId || !userId) {
      return res.status(400).json({
        success: false,
        error: 'Product ID and User ID are required'
      });
    }

    if (quantity < 1 || quantity > 100) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be between 1 and 100'
      });
    }

    const result = await paymentService.createOrder(userId, productId, quantity);
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
 */
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, razorpay_payment_id, razorpay_signature } = req.body;

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

// ========================================
// HOW TO USE THESE FILES
// ========================================

/*

STEP 1: Replace your files
  1. Copy the app.js code → backend/src/app.js
  2. Copy the paymentRoutes.js code → backend/src/routes/paymentRoutes.js
  3. Keep paymentController.js as-is (it's already correct)

STEP 2: Verify controller exports
  $ grep "exports.createOrder" backend/src/controllers/paymentController.js
  $ grep "exports.verifyPayment" backend/src/controllers/paymentController.js
  $ grep "exports.webhook" backend/src/controllers/paymentController.js

STEP 3: Test locally
  $ cd backend
  $ npm start
  
  You should see:
  ✅ Payment routes successfully loaded
  
  Then test:
  $ curl http://localhost:3000/api/payment/health

STEP 4: Deploy
  $ git add backend/src/app.js backend/src/routes/paymentRoutes.js
  $ git commit -m "fix: Payment routing with health check"
  $ git push

STEP 5: Verify deployment
  $ curl https://your-render-url/api/payment/health

*/

module.exports = {
  SETUP_COMPLETE: true
};
