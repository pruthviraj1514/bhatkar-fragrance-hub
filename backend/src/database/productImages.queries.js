// ============================================================================
// PRODUCT IMAGES QUERIES - PostgreSQL Compatible
// ============================================================================
// Converted to PostgreSQL from MySQL
// - ? placeholders → $1, $2, etc.
// - SERIAL for primary key
// - Using json_agg and json_build_object for joined data
// ============================================================================

const createTableProductImages = `
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_format VARCHAR(50),
    alt_text VARCHAR(255),
    image_order INTEGER DEFAULT 1,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_on TIMESTAMP NOT NULL DEFAULT NOW()
)
`;

const createProductImage = `
INSERT INTO product_images (product_id, image_url, image_format, alt_text, image_order, is_thumbnail)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING *
`;

const getProductImages = `
SELECT id, product_id, image_url, image_format, alt_text, image_order, is_thumbnail, created_on
FROM product_images
WHERE product_id = $1
ORDER BY image_order ASC
`;

const getProductWithImages = `
SELECT 
  p.*,
  (
    SELECT COALESCE(json_agg(pi_sub), '[]'::json)
    FROM (
      SELECT id, image_url, image_format, alt_text, image_order, is_thumbnail
      FROM product_images
      WHERE product_id = p.id
      ORDER BY image_order ASC
    ) pi_sub
  ) as images
FROM products p
WHERE p.id = $1
`;

const getAllProductsWithImages = `
SELECT 
  p.*,
  (
    SELECT COALESCE(json_agg(pi_sub), '[]'::json)
    FROM (
      SELECT id, image_url, image_format, alt_text, image_order, is_thumbnail
      FROM product_images
      WHERE product_id = p.id
      ORDER BY image_order ASC
    ) pi_sub
  ) as images
FROM products p
ORDER BY p.created_on DESC
`;

const updateProductImage = `
UPDATE product_images
SET image_url = $1, image_format = $2, alt_text = $3, image_order = $4, updated_on = NOW()
WHERE id = $5 AND product_id = $6
RETURNING *
`;

const deleteProductImage = `
DELETE FROM product_images
WHERE id = $1 AND product_id = $2
`;

const deleteProductImages = `
DELETE FROM product_images
WHERE product_id = $1
`;

module.exports = {
  createTableProductImages,
  createProductImage,
  getProductImages,
  getProductWithImages,
  getAllProductsWithImages,
  updateProductImage,
  deleteProductImage,
  deleteProductImages
};
