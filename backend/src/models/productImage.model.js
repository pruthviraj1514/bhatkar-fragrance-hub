const db = require('../config/db');  // Consolidated PostgreSQL/Supabase Pool
const {
  createProductImage: createProductImageQuery,
  getProductImages: getProductImagesQuery,
  getProductWithImages: getProductWithImagesQuery,
  getAllProductsWithImages: getAllProductsWithImagesQuery,
  updateProductImage: updateProductImageQuery,
  deleteProductImage: deleteProductImageQuery,
  deleteProductImages: deleteProductImagesQuery
} = require('../database/productImages.queries');
const { logger } = require('../utils/logger');
const Product = require('./product.model');

class ProductImage {
  constructor(productId, imageUrl, imageFormat = 'jpg', altText, imageOrder = 0, isThumbnail = false) {
    this.productId = productId;
    this.imageUrl = imageUrl;
    this.imageFormat = imageFormat || this.extractImageFormat(imageUrl);
    this.altText = altText || '';
    this.imageOrder = imageOrder;
    this.isThumbnail = isThumbnail;
  }

  // Extract image format from URL
  static extractImageFormat(url) {
    if (!url) return 'jpg';
    const match = url.match(/\.([a-zA-Z0-9]+)(\?|$)/);
    if (match && match[1]) {
      return match[1].toLowerCase();
    }
    return 'jpg';
  }

  // Extract image format from URL (instance method)
  extractImageFormat(url) {
    return ProductImage.extractImageFormat(url);
  }

  /**
   * Add a single image to a product
   * PostgreSQL/Supabase compatible
   */
  static async addImage(newImage) {
    try {
      const imageFormat = newImage.imageFormat || ProductImage.extractImageFormat(newImage.imageUrl);

      // db.query wrapper returns [resultObj, fields] for INSERTS
      // resultObj contains the inserted row (due to RETURNING *) and resultObj.insertId
      const [result] = await db.query(createProductImageQuery, [
        newImage.productId,
        newImage.imageUrl,
        imageFormat,
        newImage.altText,
        newImage.imageOrder,
        newImage.isThumbnail
      ]);

      if (!result) {
        throw new Error('Failed to insert product image - no result returned');
      }

      return {
        id: result.id || result.insertId,
        ...newImage,
        imageFormat,
        created_on: result.created_on
      };
    } catch (error) {
      logger.error(`[PostgreSQL] Add image error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get all images for a product
   */
  static async getProductImages(productId) {
    try {
      const [rows] = await db.query(getProductImagesQuery, [productId]);
      return rows;
    } catch (error) {
      logger.error(`[PostgreSQL] Get product images error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get product with all its images (includes product details)
   * Detailed product info + aggregated images array
   */
  static async getProductWithImages(productId) {
    try {
      const [rows] = await db.query(getProductWithImagesQuery, [productId]);
      if (!rows || rows.length === 0) {
        throw { kind: 'not_found' };
      }

      const product = rows[0];

      // PostgreSQL json_agg returns an array automatically with pg driver
      // If it somehow comes back as a string, parse it
      if (typeof product.images === 'string') {
        try {
          product.images = JSON.parse(product.images);
        } catch (e) {
          logger.warn(`Could not parse images string for product ${productId}`);
          product.images = [];
        }
      }

      if (Array.isArray(product.images)) {
        product.images = product.images.filter(img => img && img.image_url !== null);
      } else {
        product.images = [];
      }

      // Ensure consistent data types
      product.price = parseFloat(product.price);

      return product;
    } catch (error) {
      // Kind of a broad fallback but keeping for robustness
      if (error.kind === 'not_found') throw error;

      logger.warn(`Aggregate query for getProductWithImages failed (PID ${productId}): ${error.message}. Using fallback.`);
      try {
        const productDetails = await Product.getById(productId);
        let images = await ProductImage.getProductImages(productId);
        if (!Array.isArray(images)) images = [];
        productDetails.images = images.filter(img => img && img.image_url !== null);
        return productDetails;
      } catch (fallbackError) {
        logger.error(`Fallback getProductWithImages failure: ${fallbackError.message}`);
        throw fallbackError;
      }
    }
  }

  /**
   * Get all products with their images (Aggregated)
   */
  static async getAllProductsWithImages() {
    try {
      const [rows] = await db.query(getAllProductsWithImagesQuery);

      return rows.map(product => {
        let images = product.images;
        if (typeof images === 'string') {
          try {
            images = JSON.parse(images);
          } catch (e) {
            images = [];
          }
        }

        if (Array.isArray(images)) {
          images = images.filter(img => img && (img.image_url !== null || img.url !== null));
        } else {
          images = [];
        }

        return {
          ...product,
          price: parseFloat(product.price),
          images: images
        };
      });
    } catch (error) {
      logger.warn(`Aggregate query for getAllProductsWithImages failed: ${error.message}. Using fallback.`);
      try {
        const products = await Product.getAll();
        const results = [];
        for (const p of products) {
          let images = await ProductImage.getProductImages(p.id);
          if (!Array.isArray(images)) images = [];
          results.push({ ...p, images: images.filter(img => img && img.image_url !== null) });
        }
        return results;
      } catch (fallbackError) {
        logger.error(`Fallback getAllProductsWithImages failure: ${fallbackError.message}`);
        throw fallbackError;
      }
    }
  }

  /**
   * Update a single image
   */
  static async updateImage(imageId, productId, updates) {
    try {
      const imageFormat = updates.imageFormat || ProductImage.extractImageFormat(updates.imageUrl);

      const [result] = await db.query(updateProductImageQuery, [
        updates.imageUrl,
        imageFormat,
        updates.altText,
        updates.imageOrder,
        imageId,
        productId
      ]);

      if (result.affectedRows === 0) {
        throw { kind: 'not_found' };
      }

      return { id: imageId, productId, ...updates };
    } catch (error) {
      logger.error(`[PostgreSQL] Update image error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a single image
   */
  static async deleteImage(imageId, productId) {
    try {
      const [result] = await db.query(deleteProductImageQuery, [imageId, productId]);

      if (result.affectedRows === 0) {
        throw { kind: 'not_found' };
      }

      return { message: 'Image deleted successfully' };
    } catch (error) {
      logger.error(`[PostgreSQL] Delete image error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete all images for a product
   */
  static async deleteProductImages(productId) {
    try {
      const [result] = await db.query(deleteProductImagesQuery, [productId]);
      return { message: `${result.affectedRows} images deleted successfully` };
    } catch (error) {
      logger.error(`[PostgreSQL] Delete product images error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ProductImage;
