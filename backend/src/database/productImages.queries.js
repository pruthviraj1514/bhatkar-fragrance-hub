const createTableProductImages = `
CREATE TABLE IF NOT EXISTS product_images (
    id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_format VARCHAR(50),
    alt_text VARCHAR(255),
    image_order INT DEFAULT 1,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    KEY idx_product_id (product_id),
    KEY idx_image_order (product_id, image_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
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
WHERE p.id = ?
GROUP BY p.id
`;

const getAllProductsWithImages = `
SELECT 
  p.id, p.name, p.brand, p.price, p.category, p.concentration, 
  p.description, p.stock, p.created_on, p.is_best_seller, p.is_active,
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
`;

const updateProductImage = `
UPDATE product_images
SET image_url = ?, image_format = ?, alt_text = ?, image_order = ?
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
