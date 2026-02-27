const ProductImage = require('../models/productImage.model');
const Product = require('../models/product.model');
const { logger } = require('../utils/logger');

// Add multiple images to a product
exports.addProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { images } = req.body; // Array of { imageUrl, altText, imageOrder, isThumbnail, imageFormat }

    // DEBUG LOGGING
    console.log("Product ID:", productId);
    console.log("Images:", images);

    const pid = parseInt(productId);
    if (isNaN(pid)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid product ID'
      });
    }

    // Validate product exists
    try {
      await Product.getById(pid);
    } catch (error) {
      if (error.kind === 'not_found') {
        console.warn(`Product ${pid} not found for image attachment`);
        return res.status(404).json({
          status: 'error',
          message: `Product with id ${pid} not found`
        });
      }
      throw error;
    }

    // Validate images array
    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Images array is required and must contain at least one image'
      });
    }

    if (images.length > 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum 4 images allowed per product'
      });
    }

    // Add all images
    const addedImages = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      if (!img.imageUrl) {
        return res.status(400).json({
          status: 'error',
          message: `Image ${i + 1} is missing required field: imageUrl`
        });
      }

      const newImage = new ProductImage(
        pid,
        img.imageUrl,
        img.imageFormat || ProductImage.extractImageFormat(img.imageUrl),
        img.altText || `Product Image ${i + 1}`,
        img.imageOrder || i + 1,
        img.isThumbnail || (i === 0) // First image as thumbnail by default
      );

      const added = await ProductImage.addImage(newImage);
      addedImages.push(added);
    }

    logger.info(`Added ${addedImages.length} images to product ${pid}`);

    return res.status(201).json({
      status: 'success',
      message: `${addedImages.length} images added successfully`,
      data: addedImages
    });
  } catch (err) {
    console.error("Image insert error:", err);
    return res.status(500).json({
      status: 'error',
      message: 'Error adding images',
      error: err.message
    });
  }
};

// Get all images for a product
exports.getProductImages = async (req, res) => {
  try {
    const { productId } = req.params;

    const images = await ProductImage.getProductImages(productId);

    if (images.length === 0) {
      logger.warn(`No images found for product ${productId}`);
      return res.status(404).json({
        status: 'error',
        message: `No images found for product ${productId}`
      });
    }

    logger.info(`Retrieved ${images.length} images for product ${productId}`);

    return res.status(200).json({
      status: 'success',
      data: images,
      total: images.length
    });
  } catch (error) {
    logger.error(`Get product images error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error retrieving images'
    });
  }
};

// Get product with all images (detailed product info + images)
exports.getProductWithImages = async (req, res) => {
  try {
    const { id: productId } = req.params;

    let product = await ProductImage.getProductWithImages(productId);

    // Refresh signed URLs dynamically (prevents expired URL issues)
    const imageURLService = require('../services/imageURLService');
    product = imageURLService.refreshProductImageUrls(product);

    logger.info(`Retrieved product ${productId} with ${product.images.length} images (URLs refreshed)`);

    return res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    if (error.kind === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: `Product with id ${req.params.id} not found`
      });
    }

    // Diagnostic metadata
    let dbMeta = {};
    try {
      const db = require('../config/db');
      const result = await db.pool.query('SELECT current_database(), current_user, inet_server_addr()');
      dbMeta = result.rows[0];
    } catch (e) {
      dbMeta = { error: 'Could not fetch metadata', details: e.message };
    }

    logger.error(`Get product with images error: ${error.message}`);
    console.error("FULL ERROR DETAIL:", error);

    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error retrieving product',
      error: error.toString(),
      stack: error.stack,
      dbMetadata: dbMeta,
      hint: "Check if all columns exist and if imageURLService is correctly required"
    });
  }
};

// ============================================================
// IN-MEMORY CACHE FOR PRODUCTS (60 second TTL)
// ============================================================
const productCache = {
  data: null,
  timestamp: 0,
  ttl: 60000 // 60 seconds
};

const getCachedProducts = () => {
  const now = Date.now();
  if (productCache.data && (now - productCache.timestamp) < productCache.ttl) {
    return productCache.data;
  }
  return null;
};

const setCachedProducts = (products) => {
  productCache.data = products;
  productCache.timestamp = Date.now();
};

// Export cache clear for admin operations
exports.clearProductCache = () => {
  productCache.data = null;
  productCache.timestamp = 0;
};

// ============================================================
// GET ALL PRODUCTS WITH IMAGES - OPTIMIZED
// ============================================================
exports.getAllProductsWithImages = async (req, res) => {
  const startTime = Date.now();

  try {
    // Check cache first
    const cachedProducts = getCachedProducts();
    if (cachedProducts) {
      const duration = Date.now() - startTime;
      logger.info(`✅ Cache HIT: ${cachedProducts.length} products (${duration}ms)`);
      return res.status(200).json({
        status: 'success',
        data: cachedProducts,
        total: cachedProducts.length,
        cached: true,
        responseTime: duration
      });
    }

    logger.info('🔄 Cache MISS - Fetching from DB...');

    // Fetch from DB with timeout protection
    const dbPromise = ProductImage.getAllProductsWithImages();
    const timeoutMs = 25000; // Increased to 25s for Render cold starts
    const timeoutPromise = new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('DB query timeout')), timeoutMs);
    });

    let products;
    try {
      products = await Promise.race([dbPromise, timeoutPromise]);
    } catch (err) {
      logger.error(`Get all products DB timeout/failure: ${err.message}`);
      return res.status(503).json({
        status: 'error',
        message: 'Service is processing your request. Please refresh in a moment. (Optimizing database...)',
        data: [],
        total: 0
      });
    }

    // ============================================================
    // FAST: Use direct URLs (BASE_STORAGE_URL + path) - NO S3 calls!
    // ============================================================
    try {
      const imageURLService = require('../services/imageURLService');
      // Use FAST method: refreshProductsDirectImageUrls - NO signing, no S3 API calls
      products = imageURLService.refreshProductsDirectImageUrls(products);

      // Cache the result
      setCachedProducts(products);

      const duration = Date.now() - startTime;
      logger.info(`✅ Retrieved ${products.length} products with DIRECT URLs (${duration}ms)`);
    } catch (err) {
      // Fallback - return products with original image URLs
      logger.warn('Image URL processing failed:', err.message);
      const fallbackUrl = process.env.DEFAULT_PRODUCT_IMAGE_URL || '/uploads/default-product.png';
      products = products.map(p => ({
        ...p,
        images: (p.images || []).map(img => ({ ...img, image_url: img.image_url || fallbackUrl }))
      }));
      setCachedProducts(products);
      logger.info(`✅ Retrieved ${products.length} products with fallback images`);
    }

    const duration = Date.now() - startTime;
    return res.status(200).json({
      status: 'success',
      data: products,
      total: products.length,
      cached: false,
      responseTime: duration
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Get all products with images error: ${error.message} (${duration}ms)`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error retrieving products',
      responseTime: duration,
      ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
    });
  }
};

// Update a product image
exports.updateProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;
    const { imageUrl, altText, imageOrder } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Image URL is required'
      });
    }

    const updated = await ProductImage.updateImage(imageId, productId, {
      imageUrl,
      altText: altText || `Product Image`,
      imageOrder: imageOrder || 0
    });

    logger.info(`Updated image ${imageId} for product ${productId}`);

    return res.status(200).json({
      status: 'success',
      message: 'Image updated successfully',
      data: updated
    });
  } catch (error) {
    if (error.kind === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: `Image with id ${req.params.imageId} not found`
      });
    }
    logger.error(`Update product image error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error updating image'
    });
  }
};

// Delete a product image
exports.deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    const result = await ProductImage.deleteImage(imageId, productId);

    logger.info(`Deleted image ${imageId} from product ${productId}`);

    return res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully',
      data: result
    });
  } catch (error) {
    if (error.kind === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: `Image with id ${req.params.imageId} not found`
      });
    }
    logger.error(`Delete product image error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error deleting image'
    });
  }
};

// Delete all images for a product
exports.deleteProductImages = async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await ProductImage.deleteProductImages(productId);

    logger.info(`Deleted all images for product ${productId}`);

    return res.status(200).json({
      status: 'success',
      message: result.message,
      data: result
    });
  } catch (error) {
    logger.error(`Delete product images error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error deleting images'
    });
  }
};
