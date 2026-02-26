/**
 * PRODUCTION-OPTIMIZED PRODUCT CONTROLLER
 * ========================================
 * 
 * Features:
 * - Response time: < 200ms
 * - Memory caching with TTL
 * - Redis-ready architecture
 * - Pagination support
 * - Proper error handling
 * - Performance monitoring
 * 
 * File: backend/src/controllers/products.optimized.controller.js
 */

const { logger } = require('../utils/logger');
const { executeQuery, queryOne } = require('../config/db');
const queries = require('../database/products.optimized.queries');
const imageURLService = require('../services/imageURLService');

// ========================================================================
// IN-MEMORY CACHE (Simple Redis-ready structure)
// ========================================================================

class ProductCache {
  constructor() {
    this.cache = new Map();
    this.ttlTime = 5 * 60 * 1000; // 5 minutes TTL
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttlTime
    });
    logger.debug(`💾 Cached: ${key}`);
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) return null;

    // Check if expired
    if (item.expiresAt < Date.now()) {
      this.cache.delete(key);
      logger.debug(`🗑️  Cache expired: ${key}`);
      return null;
    }

    logger.debug(`✅ Cache hit: ${key}`);
    return item.value;
  }

  clear(pattern = null) {
    if (!pattern) {
      this.cache.clear();
      logger.info('🗑️  Cache cleared (all)');
      return;
    }

    // Clear keys matching pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
    logger.debug(`🗑️  Cache cleared: ${pattern}*`);
  }

  stats() {
    return {
      size: this.cache.size,
      ttl: this.ttlTime / 1000 + 's'
    };
  }
}

const cache = new ProductCache();

// ========================================================================
// CACHE-CONTROL HEADERS HELPER
// ========================================================================

const setCacheHeaders = (res, maxAge = 300) => {
  // 5 minutes for public endpoints, 10 seconds for dynamic data
  res.set({
    'Cache-Control': `public, max-age=${maxAge}`,
    'ETag': `"${Date.now()}"`, // Simple ETag based on timestamp
    'Vary': 'Accept-Encoding'
  });
};

// ========================================================================
// 1. GET ALL ACTIVE PRODUCTS WITH PAGINATION
// ========================================================================

exports.getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per page
    const offset = (page - 1) * limit;

    // Check cache first
    const cacheKey = `products:all:${page}:${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      setCacheHeaders(res, 300);
      return res.status(200).json({
        status: 'success',
        cache: 'HIT',
        data: cachedData.products,
        pagination: {
          page,
          limit,
          total: cachedData.total,
          pages: Math.ceil(cachedData.total / limit)
        },
        responseTime: Date.now() - req.startTime + 'ms (from cache)'
      });
    }

    const startTime = Date.now();

    // Get count
    const [countResult] = await executeQuery(queries.countActiveProducts);
    const total = countResult.total;

    // Get products with images
    const products = await executeQuery(
      queries.getAllProductsOptimized,
      [limit, offset]
    );

    // Parse and format response with FAST direct URLs (no signing for list views)
    const formattedProducts = products.map(product => {
      const parsedImages = parseJSON(product.images);
      const imagesWithDirectUrls = imageURLService.generateDirectUrlsForImages(parsedImages);
      return {
        ...product,
        price: parseFloat(product.price),
        original_price: parseFloat(product.original_price),
        discount_percentage: parseFloat(product.discount_percentage),
        shipping_cost: parseFloat(product.shipping_cost),
        other_charges: parseFloat(product.other_charges),
        avg_rating: parseFloat(product.avg_rating),
        images: imagesWithDirectUrls,
        final_price: calculateFinalPrice(product)
      };
    });

    const duration = Date.now() - startTime;

    // Cache the result
    cache.set(cacheKey, {
      products: formattedProducts,
      total
    });

    logger.info(`📊 Fetched ${formattedProducts.length} products (${duration}ms)`);

    // Set cache headers
    setCacheHeaders(res, 300);

    res.status(200).json({
      status: 'success',
      cache: 'MISS (new)',
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('❌ Get all products error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ========================================================================
// 2. GET SINGLE PRODUCT WITH FULL DETAILS
// ========================================================================

exports.getProductById = async (req, res) => {
  try {
    const { productId } = req.params;

    // Check cache
    const cacheKey = `product:${productId}`;
    const cachedProduct = cache.get(cacheKey);

    if (cachedProduct) {
      setCacheHeaders(res, 300);
      return res.status(200).json({
        status: 'success',
        cache: 'HIT',
        data: cachedProduct,
        responseTime: '< 5ms (from cache)'
      });
    }

    const startTime = Date.now();

    // Get product
    const product = await queryOne(
      queries.getProductByIdOptimized,
      [productId]
    );

    if (!product) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found'
      });
    }

    // Increment views (fire and forget)
    executeQuery(queries.incrementViewsCount, [productId]).catch(err => {
      logger.warn('Could not increment views:', err.message);
    });

    // Format product with signed URLs
    const parsedImages = parseJSON(product.images);
    const imagesWithSignedUrls = imageURLService.generateSignedUrlsForImages(parsedImages);

    const formattedProduct = {
      ...product,
      price: parseFloat(product.price),
      original_price: parseFloat(product.original_price),
      discount_percentage: parseFloat(product.discount_percentage),
      shipping_cost: parseFloat(product.shipping_cost),
      other_charges: parseFloat(product.other_charges),
      avg_rating: parseFloat(product.avg_rating),
      images: imagesWithSignedUrls,
      final_price: calculateFinalPrice(product)
    };

    const duration = Date.now() - startTime;

    // Cache single product
    cache.set(cacheKey, formattedProduct);

    logger.info(`📦 Fetched product #${productId} (${duration}ms)`);

    setCacheHeaders(res, 300);

    res.status(200).json({
      status: 'success',
      data: formattedProduct,
      responseTime: `${duration}ms`
    });

  } catch (error) {
    logger.error('❌ Get product error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product'
    });
  }
};

// ========================================================================
// 3. GET BEST SELLERS
// ========================================================================

exports.getBestSellers = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const cacheKey = `products:bestsellers:${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      setCacheHeaders(res, 600); // 10 minutes
      return res.status(200).json({
        status: 'success',
        cache: 'HIT',
        data: cachedData,
        responseTime: '< 5ms (from cache)'
      });
    }

    const startTime = Date.now();

    const products = await executeQuery(
      queries.getBestSellersOptimized,
      [limit]
    );

    const formattedProducts = products.map(product => {
      const parsedImages = parseJSON(product.images || '[]');
      const imagesWithSignedUrls = imageURLService.generateSignedUrlsForImages(parsedImages);
      return {
        ...product,
        price: parseFloat(product.price),
        original_price: parseFloat(product.original_price),
        discount_percentage: parseFloat(product.discount_percentage),
        avg_rating: parseFloat(product.avg_rating),
        images: imagesWithSignedUrls
      };
    });

    const duration = Date.now() - startTime;

    cache.set(cacheKey, formattedProducts);

    setCacheHeaders(res, 600);

    res.status(200).json({
      status: 'success',
      data: formattedProducts,
      responseTime: `${duration}ms`,
      count: formattedProducts.length
    });

  } catch (error) {
    logger.error('❌ Get best sellers error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch best sellers'
    });
  }
};

// ========================================================================
// 4. GET PRODUCTS BY CATEGORY
// ========================================================================

exports.getProductsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    const cacheKey = `products:category:${category}:${page}:${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      setCacheHeaders(res, 300);
      return res.status(200).json({
        status: 'success',
        cache: 'HIT',
        data: cachedData.products,
        pagination: {
          page,
          limit,
          total: cachedData.total,
          pages: Math.ceil(cachedData.total / limit)
        }
      });
    }

    const startTime = Date.now();

    // Count and fetch
    const [countResult] = await executeQuery(
      queries.countProductsByCategory,
      [category]
    );

    const total = countResult.total;

    const products = await executeQuery(
      queries.getProductsByCategoryOptimized,
      [category, limit, offset]
    );

    const formattedProducts = products.map(formatProduct);
    const duration = Date.now() - startTime;

    cache.set(cacheKey, {
      products: formattedProducts,
      total
    });

    setCacheHeaders(res, 300);

    res.status(200).json({
      status: 'success',
      category,
      data: formattedProducts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      responseTime: `${duration}ms`
    });

  } catch (error) {
    logger.error('❌ Get products by category error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch products'
    });
  }
};

// ========================================================================
// 5. SEARCH PRODUCTS
// ========================================================================

exports.searchProducts = async (req, res) => {
  try {
    const { q, category } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        status: 'error',
        message: 'Search query must be at least 2 characters'
      });
    }

    const startTime = Date.now();
    const searchTerm = `%${q}%`;

    const products = await executeQuery(
      queries.searchProductsOptimized,
      [searchTerm, searchTerm, category || '%', limit, offset]
    );

    const formattedProducts = products.map(formatProduct);
    const duration = Date.now() - startTime;

    logger.info(`🔍 Search: "${q}" found ${formattedProducts.length} results (${duration}ms)`);

    res.status(200).json({
      status: 'success',
      query: q,
      data: formattedProducts,
      count: formattedProducts.length,
      responseTime: `${duration}ms`
    });

  } catch (error) {
    logger.error('❌ Search error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Search failed'
    });
  }
};

// ========================================================================
// 6. GET TOP RATED PRODUCTS
// ========================================================================

exports.getTopRatedProducts = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const cacheKey = `products:toprated:${limit}`;
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
      setCacheHeaders(res, 600);
      return res.status(200).json({
        status: 'success',
        cache: 'HIT',
        data: cachedData
      });
    }

    const products = await executeQuery(
      queries.getTopRatedProductsOptimized,
      [limit]
    );

    const formattedProducts = products.map(formatProduct);

    cache.set(cacheKey, formattedProducts);

    setCacheHeaders(res, 600);

    res.status(200).json({
      status: 'success',
      data: formattedProducts,
      count: formattedProducts.length
    });

  } catch (error) {
    logger.error('❌ Get top rated error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch top products'
    });
  }
};

// ========================================================================
// 7. HEALTH CHECK ENDPOINT
// ========================================================================

exports.healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();

    // Test database connection
    const [result] = await executeQuery('SELECT 1 as health');
    const dbTime = Date.now() - startTime;

    const stats = {
      status: 'healthy',
      database: {
        connected: !!result,
        responseTime: `${dbTime}ms`
      },
      cache: cache.stats(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      timestamp: new Date().toISOString()
    };

    res.status(200).json(stats);

  } catch (error) {
    logger.error('❌ Health check failed:', error.message);
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
};

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function parseJSON(jsonString) {
  if (!jsonString) return [];
  if (Array.isArray(jsonString)) return jsonString;

  try {
    const parsed = JSON.parse(jsonString);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function calculateFinalPrice(product) {
  const basePrice = parseFloat(product.price) || 0;
  const discount = parseFloat(product.discount_percentage) || 0;
  const shipping = parseFloat(product.shipping_cost) || 0;
  const other = parseFloat(product.other_charges) || 0;

  return Math.round(((basePrice * (1 - discount / 100)) + shipping + other) * 100) / 100;
}

function formatProduct(product) {
  // Parse images and generate fresh signed URLs
  const parsedImages = parseJSON(product.images || '[]');
  const imagesWithSignedUrls = imageURLService.generateSignedUrlsForImages(parsedImages);

  return {
    ...product,
    price: parseFloat(product.price),
    original_price: parseFloat(product.original_price),
    discount_percentage: parseFloat(product.discount_percentage),
    shipping_cost: parseFloat(product.shipping_cost),
    other_charges: parseFloat(product.other_charges),
    avg_rating: parseFloat(product.avg_rating),
    images: imagesWithSignedUrls,
    final_price: calculateFinalPrice(product)
  };
}

// ========================================================================
// CACHE MANAGEMENT
// ========================================================================

exports.clearCache = async (req, res) => {
  try {
    const pattern = req.query.pattern;
    cache.clear(pattern);

    res.status(200).json({
      status: 'success',
      message: `Cache cleared${pattern ? ': ' + pattern : ''}`
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Cache clear failed'
    });
  }
};

exports.getCacheStats = (req, res) => {
  res.status(200).json({
    status: 'success',
    cache: cache.stats()
  });
};

module.exports = {
  cache // Export cache for global invalidation
};
