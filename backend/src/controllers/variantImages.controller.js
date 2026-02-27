const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * Get all images for a specific variant
 * Used for Amazon-style image gallery switching on variant selection
 */
exports.getVariantImages = async (req, res) => {
  const { variantId } = req.params;

  if (!variantId) {
    return res.status(400).json({
      status: 'error',
      message: 'Variant ID is required'
    });
  }

  const sql = `
    SELECT id, variant_id, image_url, alt_text, image_order, is_thumbnail
    FROM variant_images
    WHERE variant_id = $1 AND is_active = true
    ORDER BY image_order ASC
  `;

  try {
    const result = await db.query(sql, [variantId]);

    // If no variant-specific images, fetch product images as fallback
    if (!result.rows || result.rows.length === 0) {
      const fallbackSql = `
        SELECT pi.id, pi.image_url, pi.alt_text, pi.image_order, pi.is_thumbnail
        FROM product_variants pv
        JOIN product_images pi ON pv.product_id = pi.product_id
        WHERE pv.id = $1 AND pi.is_active = true
        ORDER BY pi.image_order ASC
      `;

      try {
        const fallbackResults = await db.query(fallbackSql, [variantId]);
        return res.status(200).json({
          status: 'success',
          data: fallbackResults.rows || [],
          total: (fallbackResults.rows || []).length,
          isFallback: true
        });
      } catch (fallbackErr) {
        logger.error(`Error fetching fallback images: ${fallbackErr.message}`);
        return res.status(200).json({
          status: 'success',
          data: [],
          total: 0,
          message: 'No images found for this variant'
        });
      }
    } else {
      return res.status(200).json({
        status: 'success',
        data: result.rows,
        total: result.rows.length,
        isFallback: false
      });
    }
  } catch (err) {
    logger.error(`Error fetching variant images: ${err.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch variant images'
    });
  }
};

/**
 * Upload images for a variant
 * Admin feature for uploading variant-specific images
 */
exports.addVariantImages = async (req, res) => {
  const { variantId } = req.params;
  const { images } = req.body; // Expected: [{ image_url, alt_text, image_order }, ...]

  if (!variantId || !images || !Array.isArray(images)) {
    return res.status(400).json({
      status: 'error',
      message: 'Variant ID and images array are required'
    });
  }

  try {
    // Check variant exists
    const checkResults = await db.query('SELECT id FROM product_variants WHERE id = $1', [variantId]);
    if (checkResults.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found'
      });
    }

    // Insert images
    const results = [];
    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const insertResult = await db.query(
        `INSERT INTO variant_images (variant_id, image_url, alt_text, image_order, is_thumbnail, is_active)
             VALUES ($1, $2, $3, $4, $5, true) RETURNING *`,
        [variantId, img.image_url, img.alt_text || '', i + 1, i === 0]
      );
      results.push({
        id: insertResult.rows[0].id,
        variant_id: variantId,
        image_url: img.image_url,
        alt_text: img.alt_text || '',
        image_order: i + 1,
        is_thumbnail: i === 0
      });
    }

    return res.status(201).json({
      status: 'success',
      message: 'Images added to variant',
      data: results,
      total: results.length
    });
  } catch (err) {
    logger.error(`Error adding variant images: ${err.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to add variant images',
      error: err.message
    });
  }
};

/**
 * Delete variant image
 */
exports.deleteVariantImage = async (req, res) => {
  const { imageId } = req.params;

  if (!imageId) {
    return res.status(400).json({
      status: 'error',
      message: 'Image ID is required'
    });
  }

  try {
    await db.query('DELETE FROM variant_images WHERE id = $1', [imageId]);
    return res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  } catch (err) {
    logger.error(`Error deleting variant image: ${err.message}`);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete image'
    });
  }
};
