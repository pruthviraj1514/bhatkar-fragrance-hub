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
  p.description, p.stock, p.created_on,
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
  p.description, p.stock, p.created_on,
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
  createProductImage,
  getProductImages,
  getProductWithImages,
  getAllProductsWithImages,
  updateProductImage,
  deleteProductImage,
  deleteProductImages
};
