const db = require('../config/db');
const { logger } = require('../utils/logger');

/**
 * Get all variants for a product
 * GET /variants/product/:productId
 * 
 * PRODUCTION FIX: Added comprehensive input validation & error handling
 */
exports.getProductVariants = async (req, res) => {
  try {
    const { productId } = req.params;

    // ===== INPUT VALIDATION =====
    // Check if productId exists
    if (!productId) {
      console.warn('⚠️ Variants API: Missing productId parameter');
      return res.status(400).json({
        status: 'error',
        message: 'Product ID is required',
        variants: [], // Safe fallback
      });
    }

    // Validate productId is numeric (prevent SQL injection)
    if (isNaN(productId) || parseInt(productId) <= 0) {
      console.warn(`⚠️ Variants API: Invalid productId format: ${productId}`);
      return res.status(400).json({
        status: 'error',
        message: 'Product ID must be a valid positive number',
        variants: [], // Safe fallback
      });
    }

    const productIdNum = parseInt(productId);
    console.log(`📦 Fetching variants for product: ${productIdNum}`);

    // ===== DATABASE QUERY WITH ERROR HANDLING =====
    let variants = [];
    try {
      const [rows] = await db.query(
        `SELECT * FROM product_variants 
         WHERE product_id = $1 AND is_active = true 
         ORDER BY variant_value ASC`,
        [productIdNum]
      );
      variants = rows || [];
    } catch (dbError) {
      console.error(`❌ Database error fetching variants for product ${productIdNum}:`, {
        message: dbError.message,
        code: dbError.code,
        sqlState: dbError.sqlState,
      });
      // Return fallback - do not crash
      return res.status(200).json({
        status: 'success',
        message: 'No variants available',
        variants: [],
        warning: 'Database query failed, returning empty variants',
      });
    }

    console.log(`✅ Found ${variants.length} variants for product ${productIdNum}`);

    // If no variants, return safe response
    if (!variants || variants.length === 0) {
      return res.status(200).json({
        status: 'success',
        message: 'Product has no variants',
        variants: [],
      });
    }

    // ===== FETCH IMAGES FOR EACH VARIANT =====
    const variantsWithImages = await Promise.all(
      variants.map(async (variant) => {
        try {
          const [rows] = await db.query(
            `SELECT id, image_url, alt_text, image_order, is_thumbnail 
             FROM variant_images 
             WHERE variant_id = $1 
             ORDER BY image_order ASC`,
            [variant.id]
          );
          return {
            ...variant,
            images: rows && rows.length > 0 ? rows : [],
          };
        } catch (imgError) {
          console.warn(`⚠️ Could not fetch images for variant ${variant.id}: ${imgError.message}`);
          // Return variant without images - don't crash
          return {
            ...variant,
            images: [],
          };
        }
      })
    );

    // ===== RETURN SUCCESS RESPONSE =====
    res.status(200).json({
      status: 'success',
      message: `Retrieved ${variantsWithImages.length} variants`,
      variants: variantsWithImages,
      count: variantsWithImages.length,
    });
  } catch (error) {
    // ===== TOP-LEVEL ERROR HANDLER =====
    console.error(`❌ Error in getProductVariants (productId: ${req.params.productId}):`, {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    // Return safe fallback instead of 500
    res.status(200).json({
      status: 'success',
      message: 'Unable to fetch variants at this time',
      variants: [],
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    const [rows] = await db.query(
      'SELECT * FROM product_variants WHERE id = $1',
      [variantId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    const variant = rows[0];

    // Get images
    const [imgRows] = await db.query(
      'SELECT * FROM variant_images WHERE variant_id = $1 ORDER BY image_order ASC',
      [variantId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        ...variant,
        images: imgRows || [],
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
    const [rows] = await db.query('SELECT id FROM products WHERE id = $1', [productId]);
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Create variant
    const variantName = variant_name || `${variant_value}${variant_unit}`;
    const [result] = await db.query(
      `INSERT INTO product_variants (product_id, variant_name, variant_value, variant_unit, price, stock, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [productId, variantName, variant_value, variant_unit, price, stock || 0]
    );

    res.status(201).json({
      status: 'success',
      message: 'Variant created successfully',
      data: {
        id: result.id,
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
    const [rows] = await db.query('SELECT * FROM product_variants WHERE id = $1', [variantId]);
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    const variant = rows[0];
    const updatePrice = price !== undefined ? price : variant.price;
    const updateStock = stock !== undefined ? stock : variant.stock;
    const updateActive = is_active !== undefined ? is_active : variant.is_active;

    // Update variant
    await db.query(
      `UPDATE product_variants 
       SET price = $1, stock = $2, is_active = $3, updated_at = NOW()
       WHERE id = $4`,
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
    const [rows] = await db.query('SELECT id FROM product_variants WHERE id = $1', [variantId]);
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found',
      });
    }

    // Delete variant (cascade deletes variant_images)
    await db.query('DELETE FROM product_variants WHERE id = $1', [variantId]);

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
    const [rows] = await db.query('SELECT id FROM product_variants WHERE id = $1', [variantId]);
    if (rows.length === 0) {
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
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [variantId, image_url, alt_text || 'Variant image', i + 1, i === 0 ? true : false]
      );
      insertedImages.push({
        id: result.id,
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

    const [rows] = await db.query('SELECT variant_id FROM variant_images WHERE id = $1', [imageId]);
    if (rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found',
      });
    }

    await db.query('DELETE FROM variant_images WHERE id = $1', [imageId]);

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
