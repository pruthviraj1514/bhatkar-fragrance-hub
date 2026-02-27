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
  p.id, p.name, p.brand, p.price, p.category, p.concentration, 
  p.description, p.stock, p.created_on, p.is_best_seller, p.is_active,
  COALESCE(
    json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'image_format', pi.image_format,
        'alt_text', pi.alt_text,
        'image_order', pi.image_order,
        'is_thumbnail', pi.is_thumbnail
      )
    ) FILTER (WHERE pi.id IS NOT NULL), 
    '[]'::json
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = $1
GROUP BY p.id
`;

const getAllProductsWithImages = `
SELECT 
  p.id, p.name, p.brand, p.price, p.category, p.concentration, 
  p.description, p.stock, p.created_on, p.is_best_seller, p.is_active,
  COALESCE(
    json_agg(
      json_build_object(
        'id', pi.id,
        'image_url', pi.image_url,
        'image_format', pi.image_format,
        'alt_text', pi.alt_text,
        'image_order', pi.image_order,
        'is_thumbnail', pi.is_thumbnail
      )
    ) FILTER (WHERE pi.id IS NOT NULL), 
    '[]'::json
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id
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
