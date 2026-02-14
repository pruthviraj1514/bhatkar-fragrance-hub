-- ========================================================================
-- MIGRATION: Add is_active and ensure is_best_seller for products table
-- ========================================================================
-- 
-- Purpose:
--   Fix "Unknown column 'p.is_active' in 'field list'" error on Railway
--   Support product visibility without hard deletes
--   Enable getAllProductsWithImages aggregate query to work
--
-- Safety:
--   - Uses IF NOT EXISTS to prevent duplicate column errors
--   - DEFAULT 1 means all existing products stay ACTIVE
--   - No data loss
--   - Backed by foreign key constraints on product_images
--
-- Before running:
--   1. Backup your database
--   2. Test on local environment first
--   3. Check that all existing products should be active (is_active=1)
--
-- ========================================================================

-- STEP 1: Add is_active column (if not exists)
-- TINYINT(1) is efficient for boolean storage
-- DEFAULT 1 ensures all existing products are active
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `is_active` TINYINT(1) NOT NULL DEFAULT 1 
COMMENT 'Product visibility control: 1=active, 0=inactive (soft delete)';

-- STEP 2: Add is_best_seller column (if not exists)
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS `is_best_seller` TINYINT(1) NOT NULL DEFAULT 0 
COMMENT 'Marks product as featured best seller on home page';

-- STEP 3: Create index for performance
-- Queries filtering by is_active will be much faster
CREATE INDEX IF NOT EXISTS `idx_is_active` ON `products` (`is_active`);

-- STEP 4: Create composite index for common queries
-- Speeds up queries like: WHERE is_active=1 ORDER BY created_on DESC
CREATE INDEX IF NOT EXISTS `idx_is_active_created_on` 
ON `products` (`is_active`, `created_on` DESC);

-- STEP 5: Verify the changes
SELECT 
  COLUMN_NAME, 
  COLUMN_TYPE, 
  IS_NULLABLE, 
  COLUMN_DEFAULT,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'products'
ORDER BY ORDINAL_POSITION;

-- STEP 6: Check data
SELECT 
  COUNT(*) as total_products,
  SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_products,
  SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive_products,
  SUM(CASE WHEN is_best_seller = 1 THEN 1 ELSE 0 END) as best_seller_products
FROM products;

-- STEP 7: Test the fixed aggregate query
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
LIMIT 1;

-- ========================================================================
-- OPTIONAL: If you want to track when columns were added:
-- ========================================================================
-- Add update trigger to auto-update timestamp on schema changes
-- ALTER TABLE products 
-- ADD COLUMN IF NOT EXISTS `updated_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ========================================================================
-- VERIFICATION queries:
-- ========================================================================

-- Check all products are now selected (should match total count)
SELECT COUNT(*) as 'Query Result Count' 
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id;

-- Show active/inactive breakdown
SELECT 
  CASE WHEN p.is_active = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END as status,
  COUNT(*) as count
FROM products p
GROUP BY p.is_active;

-- Show best sellers
SELECT 
  CASE WHEN p.is_best_seller = 1 THEN 'YES' ELSE 'NO' END as best_seller,
  COUNT(*) as count
FROM products p
GROUP BY p.is_best_seller;

-- ========================================================================
-- SAFETY: After migration, run this to confirm zero errors expected:
-- ========================================================================
-- If this returns 0 rows, your migration is complete:
SELECT 
  TABLE_NAME,
  COLUMN_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'products'
  AND COLUMN_NAME IN ('is_active', 'is_best_seller')
  AND TABLE_SCHEMA = DATABASE()
HAVING COUNT(*) < 2;
