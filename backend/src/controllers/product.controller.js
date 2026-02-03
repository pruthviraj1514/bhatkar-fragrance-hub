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
        const { name, brand, price, category, concentration, description, stock } = req.body;

        // Validate required fields
        if (!name || !brand || !price || !category || !concentration) {
            return res.status(400).send({
                status: 'error',
                message: 'Name, brand, price, category, and concentration are required'
            });
        }

        const product = new Product(name, brand, price, category, concentration, description, stock || 0);
        const data = await Product.create(product);
        logger.info(`Product created: ${data.id}`);
        return res.status(201).send({
            status: 'success',
            message: 'Product created successfully',
            data: data
        });
    } catch (error) {
        logger.error(`Create product error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

// Update product
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, brand, price, category, concentration, description, stock } = req.body;

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
            category,
            concentration,
            description,
            stock: stock || 0
        };

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
    try {
        const { id } = req.params;

        const data = await Product.delete(id);
        logger.info(`Product deleted: ${id}`);
        return res.status(200).send({
            status: 'success',
            message: 'Product deleted successfully',
            data: data
        });
    } catch (error) {
        if (error.kind === 'not_found') {
            logger.warn(`Product not found for delete: ${req.params.id}`);
            return res.status(404).send({
                status: 'error',
                message: `Product with id ${req.params.id} not found`
            });
        }
        logger.error(`Delete product error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};
