const db = require('../config/db');
const { logger } = require('../utils/logger');

/**
 * PRODUCT OPERATIONS
 */

const createProduct = (productData, callback) => {
    const { name, description, price, category, image_url } = productData;
    const query = `
        INSERT INTO products (name, description, price, category, image_url, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    `;

    connection.query(query, [name, description, price, category, image_url], (err, result) => {
        if (err) {
            logger.error(`Error creating product: ${err.message}`);
            return callback(err);
        }
        callback(null, { id: result.insertId, ...productData });
    });
};

const getAllProducts = (callback) => {
    const query = 'SELECT * FROM products ORDER BY created_at DESC';

    connection.query(query, (err, results) => {
        if (err) {
            logger.error(`Error fetching products: ${err.message}`);
            return callback(err);
        }
        callback(null, results);
    });
};

const getProductById = (id, callback) => {
    const query = 'SELECT * FROM products WHERE id = ?';

    connection.query(query, [id], (err, results) => {
        if (err) {
            logger.error(`Error fetching product: ${err.message}`);
            return callback(err);
        }
        callback(null, results[0]);
    });
};

const updateProduct = (id, productData, callback) => {
    const { name, description, price, category, image_url } = productData;
    const query = `
        UPDATE products 
        SET name = ?, description = ?, price = ?, category = ?, image_url = ?, updated_at = NOW()
        WHERE id = ?
    `;

    connection.query(query, [name, description, price, category, image_url, id], (err, result) => {
        if (err) {
            logger.error(`Error updating product: ${err.message}`);
            return callback(err);
        }
        callback(null, { id, ...productData });
    });
};

const deleteProduct = (id, callback) => {
    const query = 'DELETE FROM products WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            logger.error(`Error deleting product: ${err.message}`);
            return callback(err);
        }
        callback(null, { message: 'Product deleted successfully' });
    });
};

/**
 * PRICE OPERATIONS
 */

const createPrice = (priceData, callback) => {
    const { product_id, variant, price, currency } = priceData;
    const query = `
        INSERT INTO prices (product_id, variant, price, currency, created_at)
        VALUES (?, ?, ?, ?, NOW())
    `;

    connection.query(query, [product_id, variant, price, currency], (err, result) => {
        if (err) {
            logger.error(`Error creating price: ${err.message}`);
            return callback(err);
        }
        callback(null, { id: result.insertId, ...priceData });
    });
};

const getAllPrices = (callback) => {
    const query = 'SELECT * FROM prices ORDER BY created_at DESC';

    connection.query(query, (err, results) => {
        if (err) {
            logger.error(`Error fetching prices: ${err.message}`);
            return callback(err);
        }
        callback(null, results);
    });
};

const getPriceById = (id, callback) => {
    const query = 'SELECT * FROM prices WHERE id = ?';

    connection.query(query, [id], (err, results) => {
        if (err) {
            logger.error(`Error fetching price: ${err.message}`);
            return callback(err);
        }
        callback(null, results[0]);
    });
};

const updatePrice = (id, priceData, callback) => {
    const { product_id, variant, price, currency } = priceData;
    const query = `
        UPDATE prices 
        SET product_id = ?, variant = ?, price = ?, currency = ?, updated_at = NOW()
        WHERE id = ?
    `;

    connection.query(query, [product_id, variant, price, currency, id], (err, result) => {
        if (err) {
            logger.error(`Error updating price: ${err.message}`);
            return callback(err);
        }
        callback(null, { id, ...priceData });
    });
};

const deletePrice = (id, callback) => {
    const query = 'DELETE FROM prices WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            logger.error(`Error deleting price: ${err.message}`);
            return callback(err);
        }
        callback(null, { message: 'Price deleted successfully' });
    });
};

/**
 * PHOTO OPERATIONS
 */

const createPhoto = (photoData, callback) => {
    const { product_id, photo_url, alt_text, is_primary } = photoData;
    const query = `
        INSERT INTO photos (product_id, photo_url, alt_text, is_primary, created_at)
        VALUES (?, ?, ?, ?, NOW())
    `;

    connection.query(query, [product_id, photo_url, alt_text, is_primary || false], (err, result) => {
        if (err) {
            logger.error(`Error creating photo: ${err.message}`);
            return callback(err);
        }
        callback(null, { id: result.insertId, ...photoData });
    });
};

const getAllPhotos = (callback) => {
    const query = 'SELECT * FROM photos ORDER BY created_at DESC';

    connection.query(query, (err, results) => {
        if (err) {
            logger.error(`Error fetching photos: ${err.message}`);
            return callback(err);
        }
        callback(null, results);
    });
};

const getPhotoById = (id, callback) => {
    const query = 'SELECT * FROM photos WHERE id = ?';

    connection.query(query, [id], (err, results) => {
        if (err) {
            logger.error(`Error fetching photo: ${err.message}`);
            return callback(err);
        }
        callback(null, results[0]);
    });
};

const getPhotosByProductId = (productId, callback) => {
    const query = 'SELECT * FROM photos WHERE product_id = ? ORDER BY is_primary DESC, created_at ASC';

    connection.query(query, [productId], (err, results) => {
        if (err) {
            logger.error(`Error fetching photos for product: ${err.message}`);
            return callback(err);
        }
        callback(null, results);
    });
};

const updatePhoto = (id, photoData, callback) => {
    const { product_id, photo_url, alt_text, is_primary } = photoData;
    const query = `
        UPDATE photos 
        SET product_id = ?, photo_url = ?, alt_text = ?, is_primary = ?, updated_at = NOW()
        WHERE id = ?
    `;

    connection.query(query, [product_id, photo_url, alt_text, is_primary || false, id], (err, result) => {
        if (err) {
            logger.error(`Error updating photo: ${err.message}`);
            return callback(err);
        }
        callback(null, { id, ...photoData });
    });
};

const deletePhoto = (id, callback) => {
    const query = 'DELETE FROM photos WHERE id = ?';

    connection.query(query, [id], (err, result) => {
        if (err) {
            logger.error(`Error deleting photo: ${err.message}`);
            return callback(err);
        }
        callback(null, { message: 'Photo deleted successfully' });
    });
};

module.exports = {
    // Products
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,

    // Prices
    createPrice,
    getAllPrices,
    getPriceById,
    updatePrice,
    deletePrice,

    // Photos
    createPhoto,
    getAllPhotos,
    getPhotoById,
    getPhotosByProductId,
    updatePhoto,
    deletePhoto
};
