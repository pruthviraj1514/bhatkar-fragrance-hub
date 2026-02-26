// ============================================================================
// PRODUCT IMAGES QUERIES - MySQL Compatible
// ============================================================================
// Converted back to MySQL from PostgreSQL
// - $1 placeholders → ?
// - AUTO_INCREMENT for primary key
// - Using JSON_ARRAYAGG and JSON_OBJECT for joined data
// ============================================================================

const createTableProductImages = `
CREATE TABLE IF NOT EXISTS product_images (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_format VARCHAR(50),
    alt_text VARCHAR(255),
    image_order INT DEFAULT 1,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_on TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)
`;

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

const getProductWithImages = `
SELECT 
  p.id, p.name, p.brand, p.price, p.category, p.concentration, 
  p.description, p.stock, p.created_on, p.is_best_seller, p.is_active,
  IF(COUNT(pi.id) = 0, JSON_ARRAY(),
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', pi.id,
        'image_url', pi.image_url,
        'image_format', pi.image_format,
        'alt_text', pi.alt_text,
        'image_order', pi.image_order,
        'is_thumbnail', pi.is_thumbnail
      )
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
WHERE p.id = ?
GROUP BY p.id
`;

const getAllProductsWithImages = `
SELECT 
  p.id, p.name, p.brand, p.price, p.category, p.concentration, 
  p.description, p.stock, p.created_on, p.is_best_seller, p.is_active,
  IF(COUNT(pi.id) = 0, JSON_ARRAY(),
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', pi.id,
        'image_url', pi.image_url,
        'image_format', pi.image_format,
        'alt_text', pi.alt_text,
        'image_order', pi.image_order,
        'is_thumbnail', pi.is_thumbnail
      )
    )
  ) as images
FROM products p
LEFT JOIN product_images pi ON p.id = pi.product_id
GROUP BY p.id
ORDER BY p.created_on DESC
`;

const updateProductImage = `
UPDATE product_images
SET image_url = ?, image_format = ?, alt_text = ?, image_order = ?, updated_on = NOW()
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
