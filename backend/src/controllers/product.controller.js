const Product = require('../models/product.model');
const { logger } = require('../utils/logger');

// Get all products
exports.getAllProducts = async (req, res) => {
    try {
        const data = await Product.getAll();
        logger.info('All products retrieved successfully');
        return res.status(200).send({
            status: 'success',
            data: data
        });
    } catch (error) {
        logger.error(`Get all products error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

// Get product by ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const data = await Product.getById(id);
        logger.info(`Product retrieved: ${id}`);
        return res.status(200).send({
            status: 'success',
            data: data
        });
    } catch (error) {
        if (error.kind === 'not_found') {
            logger.warn(`Product not found: ${req.params.id}`);
            return res.status(404).send({
                status: 'error',
                message: `Product with id ${req.params.id} not found`
            });
        }
        logger.error(`Get product error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

// Create product
exports.createProduct = async (req, res) => {
    try {
        // Debug logging of incoming request body
        console.log('CreateProduct - Incoming body:', JSON.stringify(req.body));
        // Support both direct payload and nested under "product"
        const payload = req.body && req.body.product ? req.body.product : req.body;
        if (!payload || typeof payload !== 'object') {
            return res.status(400).send({
                status: 'error',
                message: 'Invalid request payload'
            });
        }
        const { name, brand, price, original_price, discount_percentage, shipping_cost, other_charges, quantity_ml, quantity_unit, category, concentration, description, stock, is_best_seller, is_luxury_product, is_active, images } = payload;
        // Validate required fields
        if (!name || !brand || price == null || !category || !concentration) {
            return res.status(400).send({
                status: 'error',
                message: 'Name, brand, price, category, and concentration are required'
            });
        }
        const product = new Product(
            name,
            brand,
            price,
            quantity_ml || 100,
            quantity_unit || 'ml',
            category,
            concentration,
            description || null,
            stock || 0,
            !!is_best_seller,
            !!is_luxury_product,
            is_active !== undefined ? !!is_active : true,
            original_price || null,
            discount_percentage || 0,
            shipping_cost || 0,
            other_charges || 0
        );
        logger.info(`Creating product: ${name}, brand: ${brand}, price: ${price}`);
        const data = await Product.create(product);
        if (images && Array.isArray(images) && images.length > 0) {
                const ProductImage = require('../models/productImage.model');

                for (let i = 0; i < images.length; i++) {
                    await ProductImage.create({
                        product_id: data.id,
                        image_url: images[i],
                        image_order: i + 1,
                        is_thumbnail: i === 0
                    });
                }
            }

        logger.info(`Product created: ${data.id}`);
        return res.status(201).send({
            status: 'success',
            message: 'Product created successfully',
            data: data
        });
    } catch (error) {
        logger.error(`Create product error: ${error.message}`);
        logger.error(`Stack trace: ${error.stack}`);
        return res.status(500).send({
            status: 'error',
            message: error.message || 'Internal server error.'
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, brand, price, original_price, discount_percentage, shipping_cost, other_charges, quantity_ml, quantity_unit, category, concentration, description, stock, is_best_seller, is_luxury_product, is_active } = req.body;

        // Validate required fields
        if (!name || !brand || !price || !category || !concentration) {
            return res.status(400).send({
                status: 'error',
                message: 'Name, brand, price, category, and concentration are required'
            });
        }

        const updatedProduct = {
            name,
            brand,
            price,
            original_price: original_price || null,
            discount_percentage: discount_percentage || 0,
            shipping_cost: shipping_cost || 0,
            other_charges: other_charges || 0,
            quantity_ml: quantity_ml || 100,
            quantity_unit: quantity_unit || 'ml',
            category,
            concentration,
            description: description || null,
            stock: stock || 0,
            is_best_seller: !!is_best_seller,
            is_luxury_product: !!is_luxury_product,
            is_active: is_active !== undefined ? !!is_active : true
        };

        // If attempting to set product active, enforce minimum 2 active reviews
        if (updatedProduct.is_active) {
            const reviewsQueries = require('../database/reviews.queries');
            const stats = await reviewsQueries.getReviewStats(id);
            const count = stats.total_reviews || 0;
            if (count < 2) {
                return res.status(400).send({ status: 'error', message: 'Product cannot be set live. At least 2 active reviews are required.' });
            }
        }

        const data = await Product.update(id, updatedProduct);
        logger.info(`Product updated: ${id}`);
        return res.status(200).send({
            status: 'success',
            message: 'Product updated successfully',
            data: data
        });
    } catch (error) {
        if (error.kind === 'not_found') {
            logger.warn(`Product not found for update: ${req.params.id}`);
            return res.status(404).send({
                status: 'error',
                message: `Product with id ${req.params.id} not found`
            });
        }
        logger.error(`Update product error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

// Delete product
exports.deleteProduct = async (req, res) => {
    const client = await require('../config/db').getConnection();
    try {
        const { id } = req.params;

        // Start transaction to delete related records
        await client.query('BEGIN');

        // Delete product images
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
        
        // Delete product variants
        await client.query('DELETE FROM product_variants WHERE product_id = $1', [id]);
        
        // Delete reviews
        await client.query('DELETE FROM reviews WHERE product_id = $1', [id]);
        
        // Delete any order_items referencing this product so FK does not block us
        await client.query('DELETE FROM order_items WHERE product_id = $1', [id]);
        
        // (legacy) Delete orders directly linked via product_id
        await client.query('DELETE FROM orders WHERE product_id = $1', [id]);
        
        // Finally delete the product itself
        const result = await client.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (!result.rows || result.rows.length === 0) {
            // nothing deleted; rollback and send 404
            await client.query('ROLLBACK');
            client.release();
            return res.status(404).send({
                status: 'error',
                message: `Product with id ${id} not found`
            });
        }

        await client.query('COMMIT');
        logger.info(`Product deleted with all related records: ${id}`);
        client.release();
        return res.status(200).send({
            status: 'success',
            message: 'Product deleted successfully',
            data: result.rows[0]
        });
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (e) {
            // Ignore rollback errors
        }
        logger.error(`Delete product error: ${error.message}`);
        client.release();

        // Provide a clearer message when FK constraint from order_items blocks deletion
        if (error.message && error.message.includes('order_items_product_id_fkey')) {
            return res.status(400).send({
                status: 'error',
                message: 'Cannot delete product because it appears in existing order items. Please remove associated orders first.'
            });
        }

        return res.status(500).send({
            status: 'error',
            message: error.message || 'Failed to delete product'
        });
    }
};
