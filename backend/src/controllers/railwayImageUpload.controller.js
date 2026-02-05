/**
 * Railway Object Storage Image Upload Controller
 * Handles image uploads and database storage
 */

const { uploadToRailway, deleteFromRailway } = require('../config/railwayStorage.config');
const db = require('../database/db');

/**
 * Upload images for a product
 * @route POST /api/images/upload/:productId
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
exports.uploadProductImages = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { productId } = req.params;
    const files = req.files;

    console.log(`📤 Upload request - Product: ${productId}, Files: ${files?.length || 0}`);

    // Validation
    if (!files || files.length === 0) {
      console.error("❌ No files in request");
      return res.status(400).json({
        status: 'error',
        message: 'No files uploaded',
      });
    }

    if (files.length > 4) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum 4 images allowed per product',
      });
    }

    // Verify product exists
    const [productExists] = await connection.query(
      'SELECT id FROM products WHERE id = ?',
      [productId]
    );

    if (productExists.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Check existing images count
    const [existingImages] = await connection.query(
      'SELECT COUNT(*) as count FROM product_images WHERE product_id = ?',
      [productId]
    );

    const existingCount = existingImages[0].count;
    if (existingCount + files.length > 4) {
      return res.status(400).json({
        status: 'error',
        message: `Product already has ${existingCount} images. Maximum 4 allowed.`,
      });
    }

    // Upload files and collect results
    const uploadedImages = [];
    const failedUploads = [];

    for (let i = 0; i < files.length; i++) {
      try {
        const file = files[i];
        console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.originalname} (${file.size} bytes)`);
        
        const imageUrl = await uploadToRailway(
          file.buffer,
          file.originalname
        );
        
        console.log(`✅ File uploaded to Railway: ${imageUrl}`);

        // Determine image order and thumbnail status
        const imageOrder = existingCount + i + 1;
        const isThumbnail = imageOrder === 1; // First image is thumbnail

        // Save to database
        const [result] = await connection.query(
          `INSERT INTO product_images 
           (product_id, image_url, image_format, alt_text, image_order, is_thumbnail, created_on, updated_on)
           VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            productId,
            imageUrl,
            file.originalname.split('.').pop().toLowerCase(), // Get file extension
            `Product - Image ${imageOrder}`,
            imageOrder,
            isThumbnail ? 1 : 0,
          ]
        );

        console.log(`✅ Saved to DB - Image ID: ${result.insertId}, URL: ${imageUrl}`);

        uploadedImages.push({
          id: result.insertId,
          product_id: productId,
          image_url: imageUrl,
          image_order: imageOrder,
          is_thumbnail: isThumbnail,
        });
      } catch (error) {
        console.error(`❌ Error uploading file ${i + 1}:`, error.message);
        failedUploads.push({
          fileName: files[i].originalname,
          error: error.message,
        });
      }
    }

    // If all uploads failed, return error
    if (uploadedImages.length === 0) {
      return res.status(500).json({
        status: 'error',
        message: 'Failed to upload all images',
        details: failedUploads,
      });
    }

    // Success response
    res.status(201).json({
      status: 'success',
      message: `Successfully uploaded ${uploadedImages.length} image(s)`,
      data: {
        uploadedCount: uploadedImages.length,
        failedCount: failedUploads.length,
        images: uploadedImages,
        failedUploads: failedUploads.length > 0 ? failedUploads : undefined,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload images',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Delete a product image
 * @route DELETE /api/images/:productId/:imageId
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
exports.deleteProductImage = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { productId, imageId } = req.params;

    // Get image details
    const [image] = await connection.query(
      'SELECT * FROM product_images WHERE id = ? AND product_id = ?',
      [imageId, productId]
    );

    if (image.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Image not found',
      });
    }

    // Delete from Railway Storage
    await deleteFromRailway(image[0].image_url);

    // Delete from database
    await connection.query(
      'DELETE FROM product_images WHERE id = ?',
      [imageId]
    );

    // Reorder remaining images
    const [remainingImages] = await connection.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY image_order ASC',
      [productId]
    );

    for (let i = 0; i < remainingImages.length; i++) {
      await connection.query(
        'UPDATE product_images SET image_order = ?, is_thumbnail = ? WHERE id = ?',
        [i + 1, i === 0 ? 1 : 0, remainingImages[i].id]
      );
    }

    res.json({
      status: 'success',
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete image',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};

/**
 * Get product with images
 * @route GET /api/products/:id/with-images
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 */
exports.getProductWithImages = async (req, res) => {
  const connection = await db.getConnection();

  try {
    const { id } = req.params;

    // Get product
    const [products] = await connection.query(
      'SELECT * FROM products WHERE id = ?',
      [id]
    );

    if (products.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Product not found',
      });
    }

    // Get images
    const [images] = await connection.query(
      'SELECT * FROM product_images WHERE product_id = ? ORDER BY image_order ASC',
      [id]
    );

    const product = products[0];
    product.images = images;

    res.json({
      status: 'success',
      data: product,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch product',
      error: error.message,
    });
  } finally {
    connection.release();
  }
};
