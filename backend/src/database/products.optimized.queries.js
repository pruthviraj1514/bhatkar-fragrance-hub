/**
 * PRODUCTION-OPTIMIZED PRODUCT QUERIES (PostgreSQL)
 * =====================================
 * 
 * Single aggregate queries - No N+1 problems
 * Response time target: < 200ms
 * 
 * Converted to Pg: Uses $1 placeholders and json_agg/json_build_object.
 */

// ========================================================================
// 1. GET ALL PRODUCTS WITH IMAGES (Main listing query)
// ========================================================================

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
  COALESCE(
    json_agg(
      json_build_object(
        'id', pi.id,
        'url', pi.image_url,
        'alt', pi.alt_text,
        'order', pi.image_order,
        'thumb', pi.is_thumbnail
      ) ORDER BY pi.image_order ASC
    ) FILTER (WHERE pi.id IS NOT NULL),
    '[]'::json
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id AND pi.image_order <= 4
WHERE p.is_active = true
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT $1 OFFSET $2
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
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'url', pi2.image_url,
          'thumb', pi2.is_thumbnail
        ) ORDER BY pi2.image_order ASC
      ) FROM product_images pi2 WHERE pi2.product_id = p.id LIMIT 1
    ),
    '[]'::json
  ) as images
FROM products p
WHERE p.is_active = true AND p.is_best_seller = true
GROUP BY p.id
ORDER BY p.views_count DESC
LIMIT $1
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
  COALESCE(
    json_agg(
      json_build_object(
        'id', pi.id,
        'url', pi.image_url,
        'alt', pi.alt_text,
        'order', pi.image_order,
        'thumb', pi.is_thumbnail
      ) ORDER BY pi.image_order ASC
    ) FILTER (WHERE pi.id IS NOT NULL),
    '[]'::json
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = $1 AND p.is_active = true
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
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'url', pi2.image_url,
          'thumb', pi2.is_thumbnail
        ) ORDER BY pi2.image_order ASC
      ) FROM product_images pi2 WHERE pi2.product_id = p.id LIMIT 1
    ),
    '[]'::json
  ) as images
FROM products p
WHERE p.is_active = true
  AND (
    p.name ILIKE $1 
    OR p.brand ILIKE $2
    OR p.category = $3
  )
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT $4 OFFSET $5
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
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'url', pi2.image_url,
          'thumb', pi2.is_thumbnail
        ) ORDER BY pi2.image_order ASC
      ) FROM product_images pi2 WHERE pi2.product_id = p.id LIMIT 1
    ),
    '[]'::json
  ) as images
FROM products p
WHERE p.is_active = true AND p.category = $1
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT $2 OFFSET $3
`;

// ========================================================================
// 6. BULK UPDATE VIEWS (for analytics)
// ========================================================================

const incrementViewsCount = `
UPDATE products 
SET views_count = views_count + 1
WHERE id = $1
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
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'url', pi2.image_url,
          'thumb', pi2.is_thumbnail
        ) ORDER BY pi2.image_order ASC
      ) FROM product_images pi2 WHERE pi2.product_id = p.id LIMIT 1
    ),
    '[]'::json
  ) as images
FROM products p
WHERE p.is_active = true AND p.avg_rating >= 4.0
GROUP BY p.id
ORDER BY p.avg_rating DESC, p.total_reviews DESC
LIMIT $1
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
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'url', pi2.image_url,
          'thumb', pi2.is_thumbnail
        ) ORDER BY pi2.image_order ASC
      ) FROM product_images pi2 WHERE pi2.product_id = p.id LIMIT 1
    ),
    '[]'::json
  ) as images
FROM products p
WHERE p.is_active = true
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT $1 OFFSET $2
`;

// ========================================================================
// 9. COUNT ACTIVE PRODUCTS (for pagination)
// ========================================================================

const countActiveProducts = `
SELECT COUNT(*) as total FROM products WHERE is_active = true
`;

const countProductsByCategory = `
SELECT COUNT(*) as total FROM products WHERE is_active = true AND category = $1
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
  (SELECT COUNT(*) FROM product_images pi WHERE pi.product_id = p.id) as image_count
FROM products p
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT $1 OFFSET $2
`;

// ========================================================================
// 11. BULK UPDATE RATINGS (Called when new review is added)
// ========================================================================

const updateProductRatingStats = `
UPDATE products p
SET avg_rating = (
  SELECT AVG(rating) FROM reviews WHERE product_id = p.id AND is_approved = true
),
total_reviews = (
  SELECT COUNT(*) FROM reviews WHERE product_id = p.id AND is_approved = true
),
updated_on = NOW()
WHERE p.id = $1
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
  COALESCE(
    (
      SELECT json_agg(
        json_build_object(
          'url', pi2.image_url,
          'thumb', pi2.is_thumbnail
        ) ORDER BY pi2.image_order ASC
      ) FROM product_images pi2 WHERE pi2.product_id = p.id LIMIT 1
    ),
    '[]'::json
  ) as images
FROM products p
WHERE p.is_active = true
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT $1 OFFSET $2
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
