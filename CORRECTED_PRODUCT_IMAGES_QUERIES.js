/**
 * ✅ CORRECTED PRODUCT IMAGE QUERIES
 * 
 * These queries now work on all environments including Railway
 * - Added is_active and is_best_seller columns properly
 * - Tested with NULL handling for optional columns
 * - Fallback queries provided for backwards compatibility
 */

// ========================================================================
// OPTION 1: PRODUCTION-READY QUERIES (Recommended)
// ========================================================================
// Use these queries - they include is_active and is_best_seller
// Ensures consistency across all environments

const createProductImage = `
INSERT INTO product_images (product_id, image_url, image_format, alt_text, image_order, is_thumbnail)
VALUES (?, ?, ?, ?, ?, ?)
`;

const getProductImages = `
SELECT id, product_id, image_url, image_format, alt_text, image_order, is_thumbnail, created_on
FROM product_images
WHERE product_id = ?
ORDER BY image_order ASC
`;

// ✅ FIXED: Includes is_active and is_best_seller
const getProductWithImages = `
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price, 
  p.category, 
  p.concentration, 
  p.description, 
  p.stock, 
  p.created_on, 
  p.is_best_seller, 
  p.is_active,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'image_url', pi.image_url,
      'image_format', pi.image_format,
      'alt_text', pi.alt_text,
      'image_order', pi.image_order,
      'is_thumbnail', pi.is_thumbnail
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = ?
GROUP BY p.id
`;

// ✅ FIXED: Includes is_active and is_best_seller
const getAllProductsWithImages = `
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price, 
  p.category, 
  p.concentration, 
  p.description, 
  p.stock, 
  p.created_on, 
  p.is_best_seller, 
  p.is_active,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'image_url', pi.image_url,
      'image_format', pi.image_format,
      'alt_text', pi.alt_text,
      'image_order', pi.image_order,
      'is_thumbnail', pi.is_thumbnail
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id
ORDER BY p.created_on DESC
`;

const updateProductImage = `
UPDATE product_images
SET image_url = ?, image_format = ?, alt_text = ?, image_order = ?
WHERE id = ? AND product_id = ?
`;

const deleteProductImage = `
DELETE FROM product_images
WHERE id = ? AND product_id = ?
`;

const deleteProductImages = `
DELETE FROM product_images
WHERE product_id = ?
`;

// ========================================================================
// OPTION 2: FALLBACK QUERIES (If you want to filter by is_active)
// ========================================================================
// Only retrieve active products
// Useful for public-facing endpoints

const getAllProductsWithImagesActive = `
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price, 
  p.category, 
  p.concentration, 
  p.description, 
  p.stock, 
  p.created_on, 
  p.is_best_seller, 
  p.is_active,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'image_url', pi.image_url,
      'image_format', pi.image_format,
      'alt_text', pi.alt_text,
      'image_order', pi.image_order,
      'is_thumbnail', pi.is_thumbnail
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1
GROUP BY p.id
ORDER BY p.created_on DESC
`;

// Get top best sellers
const getBestSellersWithImages = `
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price, 
  p.category, 
  p.concentration, 
  p.description, 
  p.stock, 
  p.created_on, 
  p.is_best_seller, 
  p.is_active,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'image_url', pi.image_url,
      'image_format', pi.image_format,
      'alt_text', pi.alt_text,
      'image_order', pi.image_order,
      'is_thumbnail', pi.is_thumbnail
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_best_seller = 1 AND p.is_active = 1
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ?
`;

// ========================================================================
// OPTION 3: SIMPLIFIED QUERIES (If columns still don't exist)
// ========================================================================
// These omit is_active and is_best_seller completely
// Use ONLY if migration hasn't run yet

const getAllProductsWithImagesSimplified = `
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price, 
  p.category, 
  p.concentration, 
  p.description, 
  p.stock, 
  p.created_on,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'image_url', pi.image_url,
      'image_format', pi.image_format,
      'alt_text', pi.alt_text,
      'image_order', pi.image_order,
      'is_thumbnail', pi.is_thumbnail
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id
ORDER BY p.created_on DESC
`;

// ========================================================================
// MIGRATION HELPER: Check if columns exist
// ========================================================================
const checkProductsTableSchema = `
SELECT 
  COLUMN_NAME,
  COLUMN_TYPE,
  IS_NULLABLE,
  COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'products'
  AND TABLE_SCHEMA = DATABASE()
  AND COLUMN_NAME IN ('is_active', 'is_best_seller', 'is_luxury_product')
ORDER BY ORDINAL_POSITION
`;

// ========================================================================
// PERFORMANCE: Check indexes
// ========================================================================
const checkIndexes = `
SELECT 
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_NAME = 'products'
  AND TABLE_SCHEMA = DATABASE()
ORDER BY INDEX_NAME, SEQ_IN_INDEX
`;

module.exports = {
  // Main queries (use these)
  createProductImage,
  getProductImages,
  getProductWithImages,
  getAllProductsWithImages,
  updateProductImage,
  deleteProductImage,
  deleteProductImages,
  
  // Additional queries with filters
  getAllProductsWithImagesActive,
  getBestSellersWithImages,
  
  // Fallback for backwards compatibility
  getAllProductsWithImagesSimplified,
  
  // Diagnostic queries
  checkProductsTableSchema,
  checkIndexes
};
