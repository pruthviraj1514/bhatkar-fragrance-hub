const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const authRoute = require("./routes/auth.route");
const adminRoute = require("./routes/admin.route");
const productRoute = require("./routes/product.route");
const variantRoute = require("./routes/variants.route");
const reviewsRoute = require("./routes/reviews.route");
const orderRoute = require("./routes/order.route");
const uploadRoute = require("./routes/upload.route");
const imageRoute = require("./routes/image.route");
const paymentRoute = require("./routes/paymentRoutes");
const { httpLogStream } = require("./utils/logger");

const app = express();

// ===== CRITICAL: CORS MUST BE FIRST - Apply before all other middleware =====
// Production CORS - allow only production frontend
const corsOrigins = [
  process.env.FRONTEND_URL
].filter(Boolean);

// Manual CORS headers
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (corsOrigins.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin || corsOrigins[0]);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Max-Age", "3600");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Also use cors middleware as backup
app.use(cors({
  origin: corsOrigins,
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(morgan("dev"));
app.use(morgan("combined", { stream: httpLogStream }));

// ===== HEALTH CHECK ENDPOINT (for debugging) =====
app.get("/health", (req, res) => {
  const railwayConfig = {
    endpoint: process.env.S3_ENDPOINT || "❌ NOT SET",
    bucket: process.env.S3_BUCKET || "❌ NOT SET",
    accessKey: process.env.S3_ACCESS_KEY ? "✅ SET" : "❌ NOT SET",
    secretKey: process.env.S3_SECRET_KEY ? "✅ SET" : "❌ NOT SET",
  };

  console.log("🏥 Health check requested. Railway Storage config:", railwayConfig);

  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "Backend API is running with CORS enabled",
    railwayStorage: railwayConfig,
  });
});

// ===== API HEALTH CHECK ENDPOINT WITH DATABASE =====
app.get("/api/health", async (req, res) => {
  const db = require("./config/db");

  try {
    // Try database health check
    const [rows] = await db.query('SELECT 1');

    res.status(200).json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      message: "API is healthy",
      database: { status: 'connected', result: rows.length > 0 ? 'OK' : 'ERROR' }
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      timestamp: new Date().toISOString(),
      message: "API starting or Database connection failed",
      error: error.message
    });
  }
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
  const availableRoutes = [
    'GET  /health',
    'GET  /',
    'GET  /api/health',
    'POST /api/auth/signin',
    'POST /api/auth/signup',
    'GET  /api/products/with-images/all',
    'GET  /api/products/:id',
    'POST /api/payment/health',
    'POST /api/payment/create-order',
    'POST /api/payment/verify',
    'POST /api/payment/webhook',
    'GET  /api/payment/order/:orderId',
  ];

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
