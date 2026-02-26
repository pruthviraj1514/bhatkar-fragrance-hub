// ============================================================================
// PRODUCT VARIANTS QUERIES - MySQL Compatible
// ============================================================================
// Converted back to MySQL from PostgreSQL
// - $1 placeholders → ?
// - AUTO_INCREMENT for primary key
// ============================================================================

const createTableVariants = `
CREATE TABLE IF NOT EXISTS product_variants (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  variant_name VARCHAR(255) NOT NULL,
  variant_value INT NOT NULL,
  variant_unit VARCHAR(10) NOT NULL DEFAULT 'ml',
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, variant_value, variant_unit),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)
`;

const getVariantsByProductId = `
SELECT id, product_id, variant_name, variant_value, variant_unit, price, stock, is_active
FROM product_variants
WHERE product_id = ? AND is_active = TRUE
ORDER BY variant_value ASC
`;

const getVariantById = `
SELECT * FROM product_variants WHERE id = ?
`;

const createVariant = `
INSERT INTO product_variants (product_id, variant_name, variant_value, variant_unit, price, stock, is_active)
VALUES (?, ?, ?, ?, ?, ?, ?)
`;

const updateVariant = `
UPDATE product_variants 
SET variant_name = ?, variant_value = ?, variant_unit = ?, price = ?, stock = ?, is_active = ?, updated_at = NOW()
WHERE id = ?
`;

const deleteVariant = `
DELETE FROM product_variants WHERE id = ?
`;

const updateVariantStock = `
UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?
`;

const getVariantsByIds = `
SELECT id, product_id, variant_name, variant_value, variant_unit, price, stock
FROM product_variants
WHERE id IN (?)
`;

module.exports = {
  createTableVariants,
  getVariantsByProductId,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  updateVariantStock,
  getVariantsByIds
};
