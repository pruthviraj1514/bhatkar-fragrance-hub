const db = require('../config/db.config');
const { logger } = require('../utils/logger');

/**
 * Get all variants for a product
 * GET /variants/product/:productId
 */
exports.getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    const [variants] = await db.query(
      `SELECT * FROM product_variants 
       WHERE product_id = ? AND is_active = 1 
       ORDER BY variant_value ASC`,
      [productId]
    );

    // Get images for each variant
    const variantsWithImages = await Promise.all(
      variants.map(async (variant) => {
        const [images] = await db.query(
          `SELECT id, image_url, alt_text, image_order, is_thumbnail 
           FROM variant_images 
           WHERE variant_id = ? 
           ORDER BY image_order ASC`,
          [variant.id]
        );
        return {
          ...variant,
          images: images || [],
        };
      })
    );

    res.status(200).json({
      status: 'success',
      data: variantsWithImages,
    });
  } catch (error) {
    logger.error(`Error fetching variants: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch variants',
    });
  }
};

/**
 * Get single variant with images
 * GET /variants/:variantId
 */
exports.getVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    const [variants] = await db.query(
      'SELECT * FROM product_variants WHERE id = ?',
      [variantId]
    );

    if (variants.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    const variant = variants[0];

    // Get images
    const [images] = await db.query(
      'SELECT * FROM variant_images WHERE variant_id = ? ORDER BY image_order ASC',
      [variantId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        ...variant,
        images: images || [],
      },
    });
  } catch (error) {
    logger.error(`Error fetching variant: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch variant',
    });
  }
};

/**
 * Create variant (admin)
 * POST /variants
 */
exports.createVariant = async (req, res) => {
  try {
    const { productId, variant_name, variant_value, variant_unit, price, stock } = req.body;

    // Validation
    if (!productId || !variant_value || !variant_unit || !price) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields',
      });
    }

    // Check if product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Create variant
    const variantName = variant_name || `${variant_value}${variant_unit}`;
    const [result] = await db.query(
      `INSERT INTO product_variants (product_id, variant_name, variant_value, variant_unit, price, stock, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [productId, variantName, variant_value, variant_unit, price, stock || 0]
    );

    res.status(201).json({
      status: 'success',
      message: 'Variant created successfully',
      data: {
        id: result.insertId,
        product_id: productId,
        variant_name: variantName,
        variant_value,
        variant_unit,
        price,
        stock,
      },
    });
  } catch (error) {
    logger.error(`Error creating variant: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to create variant',
    });
  }
};

/**
 * Update variant (admin)
 * PUT /variants/:variantId
 */
exports.updateVariant = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { price, stock, is_active } = req.body;

    // Check if variant exists
    const [variants] = await db.query('SELECT * FROM product_variants WHERE id = ?', [variantId]);
    if (variants.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    const variant = variants[0];
    const updatePrice = price !== undefined ? price : variant.price;
    const updateStock = stock !== undefined ? stock : variant.stock;
    const updateActive = is_active !== undefined ? is_active : variant.is_active;

    // Update variant
    await db.query(
      `UPDATE product_variants 
       SET price = ?, stock = ?, is_active = ?, updated_at = NOW()
       WHERE id = ?`,
      [updatePrice, updateStock, updateActive, variantId]
    );

    res.status(200).json({
      status: 'success',
      message: 'Variant updated successfully',
      data: {
        id: variantId,
        price: updatePrice,
        stock: updateStock,
        is_active: updateActive,
      },
    });
  } catch (error) {
    logger.error(`Error updating variant: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to update variant',
    });
  }
};

/**
 * Delete variant (admin)
 * DELETE /variants/:variantId
 */
exports.deleteVariant = async (req, res) => {
  try {
    const { variantId } = req.params;

    // Check if variant exists
    const [variants] = await db.query('SELECT id FROM product_variants WHERE id = ?', [variantId]);
    if (variants.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    // Delete variant (cascade deletes variant_images)
    await db.query('DELETE FROM product_variants WHERE id = ?', [variantId]);

    res.status(200).json({
      status: 'success',
      message: 'Variant deleted successfully',
    });
  } catch (error) {
    logger.error(`Error deleting variant: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete variant',
    });
  }
};

/**
 * Upload images for variant
 * POST /variants/:variantId/images
 */
exports.uploadVariantImages = async (req, res) => {
  try {
    const { variantId } = req.params;
    const { images } = req.body;

    // Check if variant exists
    const [variants] = await db.query('SELECT id FROM product_variants WHERE id = ?', [variantId]);
    if (variants.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No images provided',
      });
    }

    // Insert images
    const insertedImages = [];
    for (let i = 0; i < images.length; i++) {
      const { image_url, alt_text } = images[i];
      const [result] = await db.query(
        `INSERT INTO variant_images (variant_id, image_url, alt_text, image_order, is_thumbnail)
         VALUES (?, ?, ?, ?, ?)`,
        [variantId, image_url, alt_text || 'Variant image', i + 1, i === 0 ? 1 : 0]
      );
      insertedImages.push({
        id: result.insertId,
        image_url,
        alt_text,
        image_order: i + 1,
        is_thumbnail: i === 0,
      });
    }

    res.status(201).json({
      status: 'success',
      message: 'Images uploaded successfully',
      data: insertedImages,
    });
  } catch (error) {
    logger.error(`Error uploading variant images: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload images',
    });
  }
};

/**
 * Delete variant image
 * DELETE /variants/images/:imageId
 */
exports.deleteVariantImage = async (req, res) => {
  try {
    const { imageId } = req.params;

    const [images] = await db.query('SELECT variant_id FROM variant_images WHERE id = ?', [imageId]);
    if (images.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found',
      });
    }

    await db.query('DELETE FROM variant_images WHERE id = ?', [imageId]);

    res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully',
    });
  } catch (error) {
    logger.error(`Error deleting variant image: ${error.message}`);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete image',
    });
  }
};
