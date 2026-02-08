const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const authRoute = require("./routes/auth.route");
const adminRoute = require("./routes/admin.route");
const productRoute = require("./routes/product.route");
const variantRoute = require("./routes/productVariant.route");
const variantImagesRoute = require("./routes/variantImages.route");
const orderRoute = require("./routes/order.route");
const uploadRoute = require("./routes/upload.route");
const imageRoute = require("./routes/image.route");
const { httpLogStream } = require("./utils/logger");

const app = express();

// ===== CRITICAL: CORS MUST BE FIRST - Apply before all other middleware =====
// Manual CORS headers
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Access-Control-Max-Age", "3600");
  
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Also use cors middleware as backup
app.use(cors({
  origin: "*",
  credentials: false,
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

app.get("/", (req, res) => {
  res.status(200).send({
    status: "success",
    data: {
      message: "API working fine"
    }
  });
});

// ===== API ROUTES =====
app.use("/api/auth", authRoute);
app.use("/api/admin", adminRoute);
app.use("/api/products", productRoute);
app.use("/api/variants", variantRoute);
app.use("/api/variant-images", variantImagesRoute);
app.use("/api/orders", orderRoute);
app.use("/api/upload-image", uploadRoute);
app.use("/api/images", imageRoute);

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString()
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
