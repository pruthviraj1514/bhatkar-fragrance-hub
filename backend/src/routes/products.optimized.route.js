/**
 * PRODUCTION-OPTIMIZED ROUTES
 * ===========================
 * 
 * Features:
 * - Proper HTTP caching
 * - Compression middleware
 * - Performance monitoring
 * - Error handling
 * 
 * File: backend/src/routes/products.optimized.route.js
 */

const router = require('express').Router();
const { asyncHandler } = require('../middlewares/asyncHandler');
const controller = require('../controllers/products.optimized.controller');
const { logger } = require('../utils/logger');

// ========================================================================
// PERFORMANCE MONITORING MIDDLEWARE
// ========================================================================

const performanceMiddleware = (req, res, next) => {
  req.startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - req.startTime;
    
    logger.info(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    
    // Warn if slow
    if (duration > 1000) {
      logger.warn(`⚠️  Slow response: ${req.path} took ${duration}ms`);
    }
  });
  
  next();
};

// Apply performance monitoring
router.use(performanceMiddleware);

// ========================================================================
// PUBLIC ROUTES (No authentication required)
// ========================================================================

/**
 * GET /api/products
 * Get all active products with pagination
 * 
 * Query params:
 * - page: 1-based page number (default: 1)
 * - limit: items per page, max 100 (default: 20)
 * 
 * Response: < 200ms
 */
router.get(
  '',
  asyncHandler(controller.getAllProducts)
);

/**
 * GET /api/products/health
 * Health check endpoint for monitoring
 * 
 * Returns: Database connection status, cache stats, memory usage
 */
router.get(
  '/health/check',
  asyncHandler(controller.healthCheck)
);

/**
 * GET /api/products/bestsellers
 * Get featured best seller products
 * 
 * Query params:
 * - limit: max items (default: 10, max: 50)
 * 
 * Cache: 10 minutes
 */
router.get(
  '/bestsellers',
  asyncHandler(controller.getBestSellers)
);

/**
 * GET /api/products/top-rated
 * Get highest rated products
 * 
 * Query params:
 * - limit: max items (default: 10, max: 50)
 * 
 * Cache: 10 minutes
 */
router.get(
  '/top-rated',
  asyncHandler(controller.getTopRatedProducts)
);

/**
 * GET /api/products/search
 * Search products by name, brand, or category
 * 
 * Query params:
 * - q: search term (min 2 chars, required)
 * - category: filter by category (optional)
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * 
 * response: < 300ms
 */
router.get(
  '/search',
  asyncHandler(controller.searchProducts)
);

/**
 * GET /api/products/category/:category
 * Get products by category
 * 
 * Params:
 * - category: product category (Men, Women, Unisex, etc)
 * 
 * Query params:
 * - page: page number (default: 1)
 * - limit: items per page (default: 20, max: 100)
 * 
 * Cache: 5 minutes
 */
router.get(
  '/category/:category',
  asyncHandler(controller.getProductsByCategory)
);

/**
 * GET /api/products/:productId
 * Get single product with full details
 * 
 * Response includes:
 * - All product details
 * - All product images sorted by order
 * - Calculated final price
 * - Rating and review count
 * - Availability status
 * 
 * Side effects: Increments view count
 * Cache: 5 minutes
 */
router.get(
  '/:productId',
  asyncHandler(controller.getProductById)
);

// ========================================================================
// ADMIN ROUTES (Protected)
// ========================================================================

const adminAuth = require('../middlewares/adminAuth');

/**
 * POST /api/products/admin/cache/clear
 * Clear application cache (admin only)
 * 
 * Query params:
 * - pattern: optional cache key pattern to clear (e.g., "products:*")
 */
router.post(
  '/admin/cache/clear',
  adminAuth,
  asyncHandler(controller.clearCache)
);

/**
 * GET /api/products/admin/cache/stats
 * Get cache statistics (admin only)
 */
router.get(
  '/admin/cache/stats',
  adminAuth,
  asyncHandler(controller.getCacheStats)
);

// ========================================================================
// ERROR HANDLING MIDDLEWARE
// ========================================================================

router.use((err, req, res, next) => {
  logger.error('Route error:', err.message);
  
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = router;
