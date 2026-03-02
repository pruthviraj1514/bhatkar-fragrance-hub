const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const compression = require("compression");
const helmet = require("helmet");

const authRoute = require("./routes/auth.route");
const adminRoute = require("./routes/admin.route");
const productRoute = require("./routes/product.route");
const variantRoute = require("./routes/variants.route");
const reviewsRoute = require("./routes/reviews.route");
const orderRoute = require("./routes/order.route");
const uploadRoute = require("./routes/upload.route");
const imageRoute = require("./routes/image.route");
const paymentRoute = require("./routes/paymentRoutes");
const { httpLogStream, logger } = require("./utils/logger");

const app = express();

// ========================================================================
// SECURITY & OPTIMIZATION MIDDLEWARE
// ========================================================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(compression());

// ===== CRITICAL: CORS MUST BE FIRST =====
const allowedOrigins = [
  "https://bhatkar-fragrance-hub-5.onrender.com",
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan("dev"));
  app.use(morgan("combined", { stream: httpLogStream }));
}

// ========================================================================
// HEALTH CHECK ENDPOINTS
// ========================================================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get("/api/health/detailed", async (req, res) => {
  const db = require("./config/db");
  try {
    const result = await db.query('SELECT NOW()');
    res.status(200).json({
      status: "ok",
      database: "connected",
      dbTime: result.rows[0].now,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Detailed health check failed:', error.message);
    res.status(503).json({
      status: "error",
      database: "disconnected",
      message: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Bhatkar Fragrance Hub API",
    version: "1.0.0"
  });
});

// ========================================================================
// API ROUTES
// ========================================================================

app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/products", productRoute);
app.use("/api/variants", variantRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/orders", orderRoute);
app.use("/api/upload-image", uploadRoute);
app.use("/api/images", imageRoute);
app.use("/api/payment", paymentRoute);

// ========================================================================
// SERVE FRONTEND (SPA FALLBACK)
// ========================================================================

// Serve static files from the React app build directory
// Correct path assuming backend/src/app.js and frontend is in root/dist
const distPath = path.join(__dirname, "../../dist");
app.use(express.static(distPath));

// Catch-all route to serve index.html for any non-API routes
// This MUST be the last route
app.get("*", (req, res, next) => {
  // If it's an API route that reached here, let it go to 404 handler
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(distPath, "index.html"));
});

// ========================================================================
// ERROR HANDLING
// ========================================================================

// 404 Handler
app.use((req, res) => {
  logger.warn(`404 - Not Found: ${req.method} ${req.path}`);
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  if (err.stack) logger.error(err.stack);

  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    timestamp: new Date().toISOString()
  });
});

module.exports = app;
