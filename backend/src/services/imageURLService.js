/**
 * Image URL Generation Service (Legacy Support)
 * ============================================
 * Now that we store FULL PUBLIC URLs from Supabase in the database,
 * this service mostly acts as a pass-through for existing code.
 */

const { logger } = require('../utils/logger');

class ImageURLService {
  constructor() {
    this.defaultImageUrl = process.env.DEFAULT_PRODUCT_IMAGE_URL || '/uploads/default-product.png';
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://kztbfdzvulahrivixgkx.supabase.co';
    this.bucket = process.env.SUPABASE_STORAGE_BUCKET || 'products';
  }

  /**
   * For Supabase, the public URL is static and stored in the DB.
   * We just return it as-is.
   */
  processUrl(url) {
    if (!url) return this.defaultImageUrl;

    // If it's a legacy Railway URL, we should ideally handle it or log it
    if (url.includes('storageapi.dev')) {
      logger.warn(`Legacy Railway URL detected: ${url}`);
      // Migration script should handle this, but for now return as-is or default
      return url;
    }

    return url;
  }

  /**
   * Refresh signed URLs for a product's images (Legacy method name)
   * Now just ensures URLs are clean.
   */
  refreshProductImageUrls(product) {
    if (!product || !product.images) return product;

    return {
      ...product,
      images: product.images.map(img => ({
        ...img,
        image_url: this.processUrl(img.image_url)
      }))
    };
  }

  /**
   * Refresh direct URLs for a product's images (Legacy method name)
   */
  refreshProductDirectImageUrls(product) {
    return this.refreshProductImageUrls(product);
  }

  /**
   * Refresh direct URLs for multiple products
   */
  refreshProductsDirectImageUrls(products) {
    if (!Array.isArray(products)) return products;
    return products.map(p => this.refreshProductDirectImageUrls(p));
  }

  /**
   * Refresh signed URLs for multiple products
   */
  refreshProductsImageUrls(products) {
    return this.refreshProductsDirectImageUrls(products);
  }
}

module.exports = new ImageURLService();
