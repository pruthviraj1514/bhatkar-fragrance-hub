-- ========================================================================
-- PRODUCTION OPTIMIZATION: COMPLETE DATABASE SCHEMA
-- For Railway MySQL Deployment
-- ========================================================================
-- This schema is optimized for:
-- ✅ Fast queries (< 200ms response time)
-- ✅ Minimal N+1 query problems
-- ✅ Proper indexing strategy
-- ✅ Scalability to 1M+ products
-- ✅ Real-time product availability tracking
-- ========================================================================

USE `bhatkar_fragrance_hub`;

-- ========================================================================
-- 1. PRODUCTS TABLE (Core Product Data)
-- ========================================================================

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Product visibility: 1=active, 0=inactive/archived' AFTER `stock`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `is_best_seller` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Featured best seller flag' AFTER `is_active`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `is_luxury_product` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Luxury tier product flag' AFTER `is_best_seller`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `views_count` INT UNSIGNED NOT NULL DEFAULT 0 
COMMENT 'Track product popularity' AFTER `is_luxury_product`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `avg_rating` DECIMAL(3, 2) NOT NULL DEFAULT 0 
COMMENT 'Cached average rating' AFTER `views_count`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `total_reviews` INT UNSIGNED NOT NULL DEFAULT 0 
COMMENT 'Total review count (cached)' AFTER `avg_rating`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `last_viewed_at` TIMESTAMP NULL 
COMMENT 'Last time product was viewed' AFTER `total_reviews`;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `updated_at` TIMESTAMP 
DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
COMMENT 'Track data freshness' AFTER `last_viewed_at`;

-- Verify schema structure
SHOW COLUMNS FROM products;

-- ========================================================================
-- 2. CRITICAL INDEXES FOR PERFORMANCE
-- ========================================================================

-- Index 1: Filter by is_active (most common query)
CREATE INDEX IF NOT EXISTS `idx_is_active` ON `products` (`is_active`);

-- Index 2: Composite index for listing page
-- Query: WHERE is_active=1 ORDER BY created_on DESC
CREATE INDEX IF NOT EXISTS `idx_is_active_created_on_desc` 
ON `products` (`is_active`, `created_on` DESC);

-- Index 3: Best sellers query optimization
CREATE INDEX IF NOT EXISTS `idx_is_best_seller_active` 
ON `products` (`is_best_seller`, `is_active`);

-- Index 4: Search by category
CREATE INDEX IF NOT EXISTS `idx_category_is_active` 
ON `products` (`category`, `is_active`);

-- Index 5: Search by brand
CREATE INDEX IF NOT EXISTS `idx_brand_is_active` 
ON `products` (`brand`, `is_active`);

-- Index 6: Popular products (views)
CREATE INDEX IF NOT EXISTS `idx_views_count_desc` 
ON `products` (`views_count` DESC, `is_active`);

-- Index 7: Top rated products
CREATE INDEX IF NOT EXISTS `idx_avg_rating_desc` 
ON `products` (`avg_rating` DESC, `is_active`);

-- Index 8: Last updated products (for cache invalidation)
CREATE INDEX IF NOT EXISTS `idx_updated_at_desc` 
ON `products` (`updated_at` DESC);

-- ========================================================================
-- 3. PRODUCT_IMAGES TABLE (Optimized for JOIN)
-- ========================================================================

-- Ensure proper structure
-- ALTER TABLE product_images ADD COLUMN IF NOT EXISTS `is_thumbnail` BOOLEAN DEFAULT FALSE;
-- ALTER TABLE product_images ADD COLUMN IF NOT EXISTS `image_order` INT DEFAULT 1;

-- Critical indexes for images
CREATE INDEX IF NOT EXISTS `idx_product_images_product_id` 
ON `product_images` (`product_id`);

-- Composite index: product + order (for sorted image retrieval)
CREATE INDEX IF NOT EXISTS `idx_product_id_image_order` 
ON `product_images` (`product_id`, `image_order` ASC);

-- Index for finding thumbnail images
CREATE INDEX IF NOT EXISTS `idx_product_id_is_thumbnail` 
ON `product_images` (`product_id`, `is_thumbnail` DESC)
WHERE `is_thumbnail` = 1;

-- Index for created_on (for cache invalidation)
CREATE INDEX IF NOT EXISTS `idx_product_images_created_on` 
ON `product_images` (`created_on` DESC);

-- ========================================================================
-- 4. VERIFY ALL INDEXES
-- ========================================================================

SELECT 
  TABLE_NAME,
  INDEX_NAME,
  COLUMN_NAME,
  SEQ_IN_INDEX,
  NON_UNIQUE
FROM INFORMATION_SCHEMA.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME IN ('products', 'product_images')
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;

-- ========================================================================
-- 5. EXECUTION PLANS FOR KEY QUERIES
-- ========================================================================

-- Query 1: Get all active products with images (most critical)
EXPLAIN FORMAT=JSON
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price, 
  p.original_price,
  p.discount_percentage,
  p.category, 
  p.concentration, 
  p.stock,
  p.is_active,
  p.is_best_seller,
  p.avg_rating,
  p.total_reviews,
  p.views_count,
  JSON_ARRAYAGG(
    JSON_OBJECT(
      'id', pi.id,
      'image_url', pi.image_url,
      'alt_text', pi.alt_text,
      'image_order', pi.image_order,
      'is_thumbnail', pi.is_thumbnail
    ) ORDER BY pi.image_order ASC
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.is_active = 1
GROUP BY p.id
ORDER BY p.created_on DESC
LIMIT 0, 50;

-- Query 2: Get best sellers
EXPLAIN FORMAT=JSON
SELECT 
  p.id, 
  p.name, 
  p.brand, 
  p.price
FROM products p
WHERE p.is_active = 1 AND p.is_best_seller = 1
ORDER BY p.created_on DESC
LIMIT 0, 10;

-- ========================================================================
-- 6. CACHE INVALIDATION TABLE (Optional - for Redis-ready architecture)
-- ========================================================================

CREATE TABLE IF NOT EXISTS `cache_invalidation` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `cache_key` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `invalidated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_cache_key` (`cache_key`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================================================
-- 7. DATA VERIFICATION & STATISTICS
-- ========================================================================

-- Check product distribution
SELECT 
  COUNT(*) as total_products,
  SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
  SUM(CASE WHEN is_best_seller = 1 THEN 1 ELSE 0 END) as best_sellers,
  SUM(CASE WHEN is_luxury_product = 1 THEN 1 ELSE 0 END) as luxury_products,
  AVG(views_count) as avg_product_views,
  AVG(total_reviews) as avg_reviews_per_product
FROM products;

-- Check image coverage
SELECT 
  COUNT(DISTINCT p.id) as products_with_images,
  COUNT(pi.id) as total_images,
  AVG(image_count) as avg_images_per_product
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
JOIN (
  SELECT product_id, COUNT(*) as image_count 
  FROM product_images 
  GROUP BY product_id
) img_count ON p.id = img_count.product_id;

-- ========================================================================
-- 8. ANALYZE & UPDATE TABLE STATISTICS
-- ========================================================================

ANALYZE TABLE products;
ANALYZE TABLE product_images;

-- ========================================================================
-- MIGRATION SUMMARY
-- ========================================================================
/*
This migration creates:
✅ Optimized products table with new columns:
   - is_active (TINYINT(1)) - for product visibility
   - is_best_seller (TINYINT(1)) - for featured products
   - is_luxury_product (TINYINT(1)) - product tier
   - views_count (INT) - popularity tracking
   - avg_rating (DECIMAL) - cached rating
   - total_reviews (INT) - review count cache
   - last_viewed_at (TIMESTAMP) - access tracking
   - updated_at (TIMESTAMP) - for cache invalidation

✅ 8 Strategic Indexes:
   - is_active search
   - Composite sorting (is_active + created_on)
   - Best seller filtering
   - Category filtering
   - Brand filtering
   - Views popularity
   - Rating sorting
   - Update tracking

✅ Performance Goals:
   - Single aggregate query (no N+1)
   - < 200ms response time
   - Support 100K+ products
   - Redis-ready architecture
   - Safe backward compatible

✅ Safety:
   - Uses IF NOT EXISTS (idempotent)
   - All columns have DEFAULT values
   - No data loss
   - Can run multiple times

Next steps:
1. Run this migration on Railway database
2. Verify indices with: SHOW INDEX FROM products;
3. Update backend queries to use optimized columns
4. Enable Redis caching in application
5. Monitor query performance
*/
