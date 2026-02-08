const db = require('../config/db.config');
const logger = require('../utils/logger');

/**
 * Get all images for a specific variant
 * Used for Amazon-style image gallery switching on variant selection
 */
exports.getVariantImages = (req, res) => {
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
    WHERE variant_id = ? AND is_active = 1
    ORDER BY image_order ASC
  `;

  db.query(sql, [variantId], (err, results) => {
    if (err) {
      logger.error(`Error fetching variant images: ${err.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch variant images'
      });
    }

    // If no variant-specific images, fetch product images as fallback
    if (!results || results.length === 0) {
      const fallbackSql = `
        SELECT pi.id, pi.image_url, pi.alt_text, pi.image_order, pi.is_thumbnail
        FROM product_variants pv
        JOIN product_images pi ON pv.product_id = pi.product_id
        WHERE pv.id = ? AND pi.is_active = 1
        ORDER BY pi.image_order ASC
      `;

      db.query(fallbackSql, [variantId], (fallbackErr, fallbackResults) => {
        if (fallbackErr) {
          logger.error(`Error fetching fallback images: ${fallbackErr.message}`);
          return res.status(200).json({
            status: 'success',
            data: [],
            total: 0,
            message: 'No images found for this variant'
          });
        }

        return res.status(200).json({
          status: 'success',
          data: fallbackResults || [],
          total: (fallbackResults || []).length,
          isFallback: true
        });
      });
    } else {
      return res.status(200).json({
        status: 'success',
        data: results,
        total: results.length,
        isFallback: false
      });
    }
  });
};

/**
 * Upload images for a variant
 * Admin feature for uploading variant-specific images
 */
exports.addVariantImages = (req, res) => {
  const { variantId } = req.params;
  const { images } = req.body; // Expected: [{ image_url, alt_text, image_order }, ...]

  if (!variantId || !images || !Array.isArray(images)) {
    return res.status(400).json({
      status: 'error',
      message: 'Variant ID and images array are required'
    });
  }

  // Check variant exists
  db.query('SELECT id FROM product_variants WHERE id = ?', [variantId], (checkErr, checkResults) => {
    if (checkErr || !checkResults || checkResults.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found'
      });
    }

    // Insert images
    const insertPromises = images.map((img, index) => {
      return new Promise((resolve, reject) => {
        db.query(
          `INSERT INTO variant_images (variant_id, image_url, alt_text, image_order, is_thumbnail, is_active)
           VALUES (?, ?, ?, ?, ?, 1)`,
          [variantId, img.image_url, img.alt_text || '', index + 1, index === 0],
          (insertErr, insertResult) => {
            if (insertErr) {
              reject(insertErr);
            } else {
              resolve({
                id: insertResult.insertId,
                variant_id: variantId,
                image_url: img.image_url,
                alt_text: img.alt_text || '',
                image_order: index + 1,
                is_thumbnail: index === 0
              });
            }
          }
        );
      });
    });

    Promise.all(insertPromises)
      .then((results) => {
        return res.status(201).json({
          status: 'success',
          message: 'Images added to variant',
          data: results,
          total: results.length
        });
      })
      .catch((err) => {
        logger.error(`Error adding variant images: ${err.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to add variant images',
          error: err.message
        });
      });
  });
};

/**
 * Delete variant image
 */
exports.deleteVariantImage = (req, res) => {
  const { imageId } = req.params;

  if (!imageId) {
    return res.status(400).json({
      status: 'error',
      message: 'Image ID is required'
    });
  }

  db.query('DELETE FROM variant_images WHERE id = ?', [imageId], (err) => {
    if (err) {
      logger.error(`Error deleting variant image: ${err.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete image'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Image deleted successfully'
    });
  });
};
