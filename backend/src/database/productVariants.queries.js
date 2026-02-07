// Product Variants Queries

const createTableVariants = `
CREATE TABLE IF NOT EXISTS product_variants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  product_id INT NOT NULL,
  variant_name VARCHAR(255) NOT NULL COMMENT 'e.g., 50ml, 100ml, 250ml',
  variant_value INT NOT NULL COMMENT 'e.g., 50, 100, 250',
  variant_unit VARCHAR(10) NOT NULL DEFAULT 'ml' COMMENT 'ml, g, oz, etc',
  price DECIMAL(10, 2) NOT NULL COMMENT 'Variant-specific price',
  stock INT NOT NULL DEFAULT 0 COMMENT 'Variant-specific stock',
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6),
  updated_at TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_variant (product_id, variant_value, variant_unit),
  INDEX idx_product (product_id)
)
`;

const getVariantsByProductId = `
SELECT id, product_id, variant_name, variant_value, variant_unit, price, stock, is_active
FROM product_variants
WHERE product_id = ? AND is_active = 1
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
SET variant_name = ?, variant_value = ?, variant_unit = ?, price = ?, stock = ?, is_active = ?
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
