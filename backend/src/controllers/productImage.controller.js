const ProductImage = require('../models/productImage.model');
const Product = require('../models/product.model');
const { logger } = require('../utils/logger');

// Add multiple images to a product
exports.addProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const { images } = req.body; // Array of { imageUrl, altText, imageOrder, isThumbnail, imageFormat }

    // Validate product exists
    try {
      await Product.getById(productId);
    } catch (error) {
      if (error.kind === 'not_found') {
        return res.status(404).json({
          status: 'error',
          message: `Product with id ${productId} not found`
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
        productId,
        img.imageUrl,
        img.imageFormat || ProductImage.extractImageFormat(img.imageUrl),
        img.altText || `Product Image ${i + 1}`,
        img.imageOrder || i + 1,
        img.isThumbnail || (i === 0) // First image as thumbnail by default
      );

      const added = await ProductImage.addImage(newImage);
      addedImages.push(added);
    }

    logger.info(`Added ${addedImages.length} images to product ${productId}`);

    return res.status(201).json({
      status: 'success',
      message: `${addedImages.length} images added successfully`,
      data: addedImages
    });
  } catch (error) {
    logger.error(`Add product images error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Error adding images'
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
    const { productId } = req.params;

    const product = await ProductImage.getProductWithImages(productId);

    logger.info(`Retrieved product ${productId} with ${product.images.length} images`);

    return res.status(200).json({
      status: 'success',
      data: product
    });
  } catch (error) {
    if (error.kind === 'not_found') {
      return res.status(404).json({
        status: 'error',
        message: `Product with id ${req.params.productId} not found`
      });
    }
    logger.error(`Get product with images error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error retrieving product',
      ...(process.env.NODE_ENV !== 'production' ? { stack: error.stack } : {})
    });
  }
};

// Get all products with images (for listing page)
exports.getAllProductsWithImages = async (req, res) => {
  try {
    const products = await ProductImage.getAllProductsWithImages();

    logger.info(`Retrieved ${products.length} products with images`);

    return res.status(200).json({
      status: 'success',
      data: products,
      total: products.length
    });
  } catch (error) {
    logger.error(`Get all products with images error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error retrieving products',
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
