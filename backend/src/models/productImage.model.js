const db = require('../config/db.config');
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

  // Add a single image to a product
  static async addImage(newImage) {
    try {
      const imageFormat = newImage.imageFormat || ProductImage.extractImageFormat(newImage.imageUrl);
      const result = await db.query(createProductImageQuery, [
        newImage.productId,
        newImage.imageUrl,
        imageFormat,
        newImage.altText,
        newImage.imageOrder,
        newImage.isThumbnail
      ]);

      return {
        id: result[0].insertId,
        ...newImage,
        imageFormat
      };
    } catch (error) {
      logger.error(`Add image error: ${error.message}`);
      throw error;
    }
  }

  // Get all images for a product
  static async getProductImages(productId) {
    try {
      const [rows] = await db.query(getProductImagesQuery, [productId]);
      return rows;
    } catch (error) {
      logger.error(`Get product images error: ${error.message}`);
      throw error;
    }
  }

  // Get product with all its images (includes product details)
  static async getProductWithImages(productId) {
    try {
      const [rows] = await db.query(getProductWithImagesQuery, [productId]);
      if (rows.length === 0) {
        throw { kind: 'not_found' };
      }

      const product = rows[0];
      // mysql2 returns JSON_ARRAYAGG already parsed as array
      if (product.images && Array.isArray(product.images)) {
        // Filter out null image objects (from products with no images)
        product.images = product.images.filter(img => img && img.image_url !== null);
      } else if (product.images && typeof product.images === 'string') {
        // Fallback for string JSON (if needed)
        try {
          const parsed = JSON.parse(product.images);
          product.images = Array.isArray(parsed) ? parsed.filter(img => img && img.image_url !== null) : [];
        } catch (e) {
          logger.warn(`Could not parse images string for product ${productId}`);
          product.images = [];
        }
      } else {
        product.images = [];
      }

      // Convert price to number
      product.price = parseFloat(product.price);

      return product;
    } catch (error) {
      logger.error(`Get product with images error: ${error.message}`);
      throw error;
    }
  }

  // Get all products with their images
  static async getAllProductsWithImages() {
    try {
      const [rows] = await db.query(getAllProductsWithImagesQuery);

      const products = rows.map(product => {
        // mysql2 returns JSON_ARRAYAGG already parsed as array
        let images = [];
        if (product.images && Array.isArray(product.images)) {
          // Filter out null image objects (from products with no images)
          images = product.images.filter(img => img && img.image_url !== null);
        } else if (product.images && typeof product.images === 'string') {
          // Fallback for string JSON (if needed)
          try {
            const parsed = JSON.parse(product.images);
            images = Array.isArray(parsed) ? parsed.filter(img => img && img.image_url !== null) : [];
          } catch (e) {
            logger.warn(`Could not parse images string for product ${product.id}`);
            images = [];
          }
        }
        
        return {
          ...product,
          price: parseFloat(product.price),
          images: images
        };
      });

      return products;
    } catch (error) {
      logger.error(`Get all products with images error: ${error.message}`);
      throw error;
    }
  }

  // Update a single image
  static async updateImage(imageId, productId, updates) {
    try {
      const imageFormat = updates.imageFormat || ProductImage.extractImageFormat(updates.imageUrl);
      const result = await db.query(updateProductImageQuery, [
        updates.imageUrl,
        imageFormat,
        updates.altText,
        updates.imageOrder,
        imageId,
        productId
      ]);

      if (result[0].affectedRows === 0) {
        throw { kind: 'not_found' };
      }

      return { id: imageId, productId, ...updates };
    } catch (error) {
      logger.error(`Update image error: ${error.message}`);
      throw error;
    }
  }

  // Delete a single image
  static async deleteImage(imageId, productId) {
    try {
      const result = await db.query(deleteProductImageQuery, [imageId, productId]);

      if (result[0].affectedRows === 0) {
        throw { kind: 'not_found' };
      }

      return { message: 'Image deleted successfully' };
    } catch (error) {
      logger.error(`Delete image error: ${error.message}`);
      throw error;
    }
  }

  // Delete all images for a product
  static async deleteProductImages(productId) {
    try {
      const result = await db.query(deleteProductImagesQuery, [productId]);
      return { message: `${result[0].affectedRows} images deleted successfully` };
    } catch (error) {
      logger.error(`Delete product images error: ${error.message}`);
      throw error;
    }
  }
}

module.exports = ProductImage;
