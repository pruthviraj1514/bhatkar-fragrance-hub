const ProductImage = require('../models/productImage.model');
const Product = require('../models/product.model');
const { uploadToSupabase, deleteFromSupabase } = require('../config/supabaseStorage.config');
const { logger } = require('../utils/logger');

/**
 * Upload images to Cloudinary and save URLs to database
 * POST /api/products/:productId/upload-images
 */
exports.uploadProductImages = async (req, res) => {
  try {
    const { productId } = req.params;
    const files = req.files;

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

    // Validate files
    if (!files || files.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images provided. Please select at least one image.'
      });
    }

    if (files.length > 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum 4 images allowed per product'
      });
    }

    logger.info(`📤 Uploading ${files.length} images to Cloudinary for product ${productId}...`);

    // Upload all files to Supabase
    const uploadedImages = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];

        logger.info(`  Uploading image ${i + 1}/${files.length}: ${file.originalname}`);

        // Upload to Supabase
        const publicUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);

        uploadedImages.push({
          imageUrl: publicUrl,
          altText: req.body[`altText_${i}`] || `Product Image ${i + 1}`,
          imageOrder: i + 1,
          isThumbnail: i === 0, // First image as thumbnail
          imageFormat: file.mimetype.split('/')[1] || 'jpg'
        });
      } catch (uploadError) {
        logger.error(`Failed to upload image ${i + 1}: ${uploadError.message}`);

        return res.status(500).json({
          status: 'error',
          message: `Failed to upload image ${i + 1}: ${uploadError.message}`
        });
      }
    }

    // Save image URLs to database
    const savedImages = [];
    for (const imgData of uploadedImages) {
      try {
        logger.info(`  Saving image to database: ${imgData.imageUrl}`);

        const saved = await ProductImage.addImage({
          productId,
          imageUrl: imgData.imageUrl,
          imageFormat: imgData.imageFormat,
          altText: imgData.altText,
          imageOrder: imgData.imageOrder,
          isThumbnail: imgData.isThumbnail
        });

        savedImages.push(saved);
        logger.info(`  ✅ Saved image with ID ${saved.id}: ${imgData.imageUrl}`);
      } catch (dbError) {
        logger.error(`Failed to save image to database: ${dbError.message}`);

        return res.status(500).json({
          status: 'error',
          message: `Failed to save image to database: ${dbError.message}`
        });
      }
    }

    logger.info(`✅ Successfully uploaded and saved ${savedImages.length} images`);

    return res.status(201).json({
      status: 'success',
      message: `Successfully uploaded ${savedImages.length} images`,
      data: savedImages
    });
  } catch (error) {
    logger.error(`Upload images error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error uploading images'
    });
  }
};

/**
 * Delete a product image
 * DELETE /api/products/:productId/images/:imageId
 */
exports.deleteProductImage = async (req, res) => {
  try {
    const { productId, imageId } = req.params;

    // Get image details before deleting
    const [images] = await require('../config/db').query(
      'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );

    if (images.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found'
      });
    }

    const image = images[0];

    // Delete from Supabase
    try {
      await deleteFromSupabase(image.image_url);
      logger.info(`✅ Deleted image from Supabase: ${image.image_url}`);
    } catch (supabaseError) {
      logger.warn(`Warning: Could not delete from Supabase: ${supabaseError.message}`);
    }

    // Delete from database
    const result = await require('../models/productImage.model').deleteImage(imageId, productId);

    return res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully',
      data: result
    });
  } catch (error) {
    logger.error(`Delete image error: ${error.message}`);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Error deleting image'
    });
  }
};

/**
 * Upload images temporarily (no DB save) and return hosted URLs
 * POST /api/images/upload-temp
 */
exports.uploadTempImages = async (req, res) => {
  try {
    const files = req.files;

    if (!files || files.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No images provided' });
    }

    if (files.length > 4) {
      return res.status(400).json({ status: 'error', message: 'Maximum 4 images allowed' });
    }

    const uploaded = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        logger.info(`  Uploading temp image ${i + 1}/${files.length}: ${file.originalname}`);
        // For Supabase, we use the same upload function but the path is already "products/..."
        // which matches the user requirement "products/${Date.now()}-${originalname}"
        const publicUrl = await uploadToSupabase(file.buffer, file.originalname, file.mimetype);

        uploaded.push({
          image_url: publicUrl,
          image_format: file.mimetype.split('/')[1] || 'jpg',
          source: 'supabase'
        });
      } catch (err) {
        logger.error('Temp upload error:', err.message);
        return res.status(500).json({ status: 'error', message: 'Failed to upload images' });
      }
    }

    return res.status(201).json({ status: 'success', data: { images: uploaded } });
  } catch (error) {
    console.error('uploadTempImages error:', error);
    return res.status(500).json({ status: 'error', message: 'Failed to upload images' });
  }
};

// Helper function to extract public ID from Cloudinary URL
function extractPublicIdFromUrl(url) {
  try {
    // Cloudinary URL format: https://res.cloudinary.com/{cloud}/image/upload/{public_id}
    const match = url.match(/\/upload\/(.+)\.(?:jpg|jpeg|png|gif|webp)/);
    return match ? match[1] : null;
  } catch (error) {
    logger.warn(`Could not extract public ID from URL: ${url}`);
    return null;
  }
}


