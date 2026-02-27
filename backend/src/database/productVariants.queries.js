// ============================================================================
// PRODUCT VARIANTS QUERIES - PostgreSQL Compatible
// ============================================================================
// Converted to PostgreSQL from MySQL
// - ? placeholders → $1, $2, etc.
// - SERIAL for primary key
// ============================================================================

const createTableVariants = `
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  variant_value INTEGER NOT NULL,
  variant_unit VARCHAR(10) NOT NULL DEFAULT 'ml',
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, variant_value, variant_unit)
)
`;

const getVariantsByProductId = `
SELECT id, product_id, variant_name, variant_value, variant_unit, price, stock, is_active
FROM product_variants
WHERE product_id = $1 AND is_active = TRUE
ORDER BY variant_value ASC
`;

const getVariantById = `
SELECT * FROM product_variants WHERE id = $1
`;

const createVariant = `
INSERT INTO product_variants (product_id, variant_name, variant_value, variant_unit, price, stock, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
`;

const updateVariant = `
UPDATE product_variants 
SET variant_name = $1, variant_value = $2, variant_unit = $3, price = $4, stock = $5, is_active = $6, updated_at = NOW()
WHERE id = $7 RETURNING *
`;

const deleteVariant = `
DELETE FROM product_variants WHERE id = $1
`;

const updateVariantStock = `
UPDATE product_variants SET stock = stock - $1 WHERE id = $2 AND stock >= $3 RETURNING *
`;

const getVariantsByIds = `
SELECT id, product_id, variant_name, variant_value, variant_unit, price, stock
FROM product_variants
WHERE id = ANY($1::int[])
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
