/**
 * PRODUCTION-OPTIMIZED PRODUCT QUERIES
 * =====================================
 * 
 * Single aggregate queries - No N+1 problems
 * Response time target: < 200ms
 * 
 * File: backend/src/database/products.optimized.queries.js
 */

// ========================================================================
// 1. GET ALL PRODUCTS WITH IMAGES (Main listing query)
// ========================================================================
// Performance: Single query with LEFT JOIN
// Time: ~50-100ms for 10K products (with pagination)
// Indexes used: idx_is_active, idx_is_active_created_on_desc

const getAllProductsOptimized = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.shipping_cost,
  p.other_charges,
  p.category,
  p.concentration,
  p.stock,
  p.created_on,
  p.is_active,
  p.is_best_seller,
  p.is_luxury_product,
  p.avg_rating,
  p.total_reviews,
  p.views_count,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'url', pi.image_url,
      'alt', pi.alt_text,
      'order', pi.image_order,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.image_order <= 4
WHERE p.is_active = 1
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ? OFFSET ?
`;

// ========================================================================
// 2. GET BEST SELLERS (Featured section)
// ========================================================================

const getBestSellersOptimized = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.category,
  p.is_best_seller,
  p.avg_rating,
  p.total_reviews,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'url', pi.image_url,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC LIMIT 1
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1 AND p.is_best_seller = 1
GROUP BY p.id
ORDER BY p.views_count DESC
LIMIT ?
`;

// ========================================================================
// 3. GET SINGLE PRODUCT WITH IMAGES
// ========================================================================

const getProductByIdOptimized = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.shipping_cost,
  p.other_charges,
  p.quantity_ml,
  p.quantity_unit,
  p.category,
  p.concentration,
  p.description,
  p.stock,
  p.created_on,
  p.is_active,
  p.is_best_seller,
  p.is_luxury_product,
  p.avg_rating,
  p.total_reviews,
  p.views_count,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'url', pi.image_url,
      'alt', pi.alt_text,
      'order', pi.image_order,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = ? AND p.is_active = 1
GROUP BY p.id
`;

// ========================================================================
// 4. SEARCH/FILTER PRODUCTS
// ========================================================================

const searchProductsOptimized = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.category,
  p.concentration,
  p.is_best_seller,
  p.avg_rating,
  p.total_reviews,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'url', pi.image_url,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC LIMIT 1
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1
  AND (
    p.name LIKE ? 
    OR p.brand LIKE ?
    OR p.category = ?
  )
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ? OFFSET ?
`;

// ========================================================================
// 5. GET PRODUCTS BY CATEGORY
// ========================================================================

const getProductsByCategoryOptimized = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.category,
  p.concentration,
  p.is_best_seller,
  p.avg_rating,
  p.total_reviews,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'url', pi.image_url,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC LIMIT 1
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1 AND p.category = ?
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ? OFFSET ?
`;

// ========================================================================
// 6. BULK UPDATE VIEWS (for analytics)
// ========================================================================

const incrementViewsCount = `
UPDATE products 
SET views_count = views_count + 1, 
    last_viewed_at = NOW()
WHERE id = ?
`;

// ========================================================================
// 7. GET TOP RATED PRODUCTS
// ========================================================================

const getTopRatedProductsOptimized = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.avg_rating,
  p.total_reviews,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'url', pi.image_url,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC LIMIT 1
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1 AND p.avg_rating >= 4.0
GROUP BY p.id
ORDER BY p.avg_rating DESC, p.total_reviews DESC
LIMIT ?
`;

// ========================================================================
// 8. GET PRODUCTS WITH AVAILABILITY
// ========================================================================

const getProductsWithAvailability = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.stock,
  CASE 
    WHEN p.stock > 10 THEN 'in_stock'
    WHEN p.stock > 0 THEN 'low_stock'
    ELSE 'out_of_stock'
  END as availability,
  p.category,
  p.is_best_seller,
  p.avg_rating,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'url', pi.image_url,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC LIMIT 1
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ? OFFSET ?
`;

// ========================================================================
// 9. COUNT ACTIVE PRODUCTS (for pagination)
// ========================================================================

const countActiveProducts = `
SELECT COUNT(*) as total FROM products WHERE is_active = 1
`;

const countProductsByCategory = `
SELECT COUNT(*) as total FROM products WHERE is_active = 1 AND category = ?
`;

// ========================================================================
// 10. GET PRODUCTS FOR ADMIN (including inactive)
// ========================================================================

const getAllProductsForAdmin = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.stock,
  p.is_active,
  p.is_best_seller,
  p.is_luxury_product,
  p.created_on,
  p.views_count,
  p.total_reviews,
  COUNT(pi.id) as image_count
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ? OFFSET ?
`;

// ========================================================================
// 11. BULK UPDATE RATINGS (Called when new review is added)
// ========================================================================

const updateProductRatingStats = `
UPDATE products p
SET p.avg_rating = (
  SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = 1
),
p.total_reviews = (
  SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = 1
),
p.updated_at = NOW()
WHERE p.id = ?
`;

// ========================================================================
// 12. GET PRODUCTS WITH CALCULATED FINAL PRICE
// ========================================================================

const getProductsWithFinalPrice = `
SELECT 
  p.id,
  p.name,
  p.brand,
  p.price,
  p.original_price,
  p.discount_percentage,
  p.shipping_cost,
  p.other_charges,
  ROUND(
    p.price * (1 - p.discount_percentage / 100) + 
    COALESCE(p.shipping_cost, 0) + 
    COALESCE(p.other_charges, 0),
    2
  ) as final_price,
  p.category,
  p.concentration,
  p.stock,
  p.is_best_seller,
  p.avg_rating,
  p.total_reviews,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'url', pi.image_url,
      'thumb', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC LIMIT 1
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT ? OFFSET ?
`;

// ========================================================================
// EXPORTS
// ========================================================================

module.exports = {
  getAllProductsOptimized,
  getBestSellersOptimized,
  getProductByIdOptimized,
  searchProductsOptimized,
  getProductsByCategoryOptimized,
  incrementViewsCount,
  getTopRatedProductsOptimized,
  getProductsWithAvailability,
  countActiveProducts,
  countProductsByCategory,
  getAllProductsForAdmin,
  updateProductRatingStats,
  getProductsWithFinalPrice
};
