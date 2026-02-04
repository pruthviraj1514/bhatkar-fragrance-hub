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
  constructor(productId, imageUrl, altText, imageOrder = 0, isThumbnail = false) {
    this.productId = productId;
    this.imageUrl = imageUrl;
    this.altText = altText || '';
    this.imageOrder = imageOrder;
    this.isThumbnail = isThumbnail;
  }

  // Add a single image to a product
  static async addImage(newImage) {
    try {
      const result = await db.query(createProductImageQuery, [
        newImage.productId,
        newImage.imageUrl,
        newImage.altText,
        newImage.imageOrder,
        newImage.isThumbnail
      ]);

      return {
        id: result[0].insertId,
        ...newImage
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
      // Parse JSON images array and filter out nulls
      try {
        if (product.images) {
          const parsed = typeof product.images === 'string' 
            ? JSON.parse(product.images) 
            : product.images;
          
          if (Array.isArray(parsed)) {
            product.images = parsed.filter(img => img && img.image_url !== null);
          } else {
            product.images = [];
          }
        } else {
          product.images = [];
        }
      } catch (parseError) {
        logger.error(`Error parsing images for product ${productId}: ${parseError.message}`);
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
        try {
          let images = [];
          if (product.images) {
            // Handle both JSON string and parsed object
            const parsed = typeof product.images === 'string' 
              ? JSON.parse(product.images) 
              : product.images;
            
            // Ensure parsed is an array and filter out nulls
            if (Array.isArray(parsed)) {
              images = parsed.filter(img => img && img.image_url !== null);
            }
          }
          
          return {
            ...product,
            price: parseFloat(product.price),
            images: images
          };
        } catch (parseError) {
          logger.error(`Error parsing images for product ${product.id}: ${parseError.message}`);
          return {
            ...product,
            price: parseFloat(product.price),
            images: []
          };
        }
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
      const result = await db.query(updateProductImageQuery, [
        updates.imageUrl,
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
