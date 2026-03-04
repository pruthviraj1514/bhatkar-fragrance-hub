const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../utils/secrets');
const { compare: comparePassword } = require('../utils/password');
const { logger } = require('../utils/logger');
const Product = require('../models/product.model');
const Order = require('../models/order.model');

// Fixed admin credentials
const ADMIN_EMAIL = 'admin@bhatkar.com';
const ADMIN_PASSWORD = 'admin123';

/**
 * Get Dashboard Stats
 */
exports.getDashboardStats = async (req, res) => {
    try {
        const productStats = await Product.getStats();
        const orderStats = await Order.getStats();

        return res.status(200).send({
            status: 'success',
            data: {
                totalProducts: productStats.total_products,
                activeProducts: productStats.active_products,
                outOfStock: productStats.out_of_stock,
                totalOrders: orderStats.total_orders,
                paidOrders: orderStats.paid_orders,
                pendingOrders: orderStats.pending_orders,
                totalRevenue: orderStats.total_revenue
            }
        });
    } catch (error) {
        logger.error(`Get dashboard stats error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error while fetching dashboard stats.'
        });
    }
};

/**
 * Admin Login
 * Only allows the fixed admin account to log in
 */
exports.login = (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email
        if (email !== ADMIN_EMAIL) {
            logger.warn(`Login attempt with invalid email: ${email}`);
            return res.status(401).send({
                status: 'error',
                message: 'Invalid credentials.'
            });
        }

        // Validate password
        if (password !== ADMIN_PASSWORD) {
            logger.warn(`Login attempt with invalid password for email: ${email}`);
            return res.status(401).send({
                status: 'error',
                message: 'Invalid credentials.'
            });
        }

        // Generate JWT token with admin flag
        const token = jwt.sign(
            {
                id: 1,
                email: ADMIN_EMAIL,
                isAdmin: true
            },
            JWT_SECRET_KEY,
            { expiresIn: '7d' }
        );

        logger.info(`Admin login successful for: ${email}`);

        return res.status(200).send({
            status: 'success',
            message: 'Login successful',
            data: {
                token,
                admin: {
                    id: 1,
                    email: ADMIN_EMAIL
                }
            }
        });
    } catch (error) {
        logger.error(`Admin login error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error during login.'
        });
    }
};

/**
 * Get Admin Profile
 * Returns admin information (requires authentication)
 */
exports.getProfile = (req, res) => {
    try {
        return res.status(200).send({
            status: 'success',
            data: {
                admin: {
                    id: req.admin.id,
                    email: req.admin.email
                }
            }
        });
    } catch (error) {
        logger.error(`Get admin profile error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

/**
 * Admin Logout
 */
exports.logout = (req, res) => {
    try {
        logger.info(`Admin logout for: ${req.admin.email}`);
        return res.status(200).send({
            status: 'success',
            message: 'Logout successful'
        });
    } catch (error) {
        logger.error(`Admin logout error: ${error.message}`);
        return res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
        });
    }
};

// ========================================================================
// PRODUCT MANAGEMENT
// ========================================================================

/**
 * Create Product
 */
exports.createProduct = async (req, res) => {
    try {
        const productData = req.body;
        const result = await Product.create(productData);
        logger.info(`Admin created product: ${result.id}`);
        res.status(201).json({
            status: 'success',
            message: 'Product created successfully',
            data: result
        });
    } catch (error) {
        logger.error(`Error creating product: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Get All Products
 */
exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.getAll();
        res.status(200).json({
            status: 'success',
            data: products
        });
    } catch (error) {
        logger.error(`Error fetching products: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Get Product By ID
 */
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.getById(id);
        res.status(200).json({
            status: 'success',
            data: product
        });
    } catch (error) {
        if (error.kind === 'not_found') {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }
        logger.error(`Error fetching product ${req.params.id}: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Update Product
 */
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const result = await Product.update(id, updatedData);
        logger.info(`Admin updated product: ${id}`);
        res.status(200).json({
            status: 'success',
            message: 'Product updated successfully',
            data: result
        });
    } catch (error) {
        if (error.kind === 'not_found') {
            return res.status(404).json({ status: 'error', message: 'Product not found' });
        }
        logger.error(`Error updating product ${req.params.id}: ${error.message}`);
        res.status(500).json({ status: 'error', message: error.message });
    }
};

/**
 * Delete Product
 */
const productController = require('./product.controller');

exports.deleteProduct = async (req, res) => {
    // delegate to the main product controller so both admin and public APIs share the same
    // deletion logic (including related cleanup and FK handling)
    return productController.deleteProduct(req, res);
};
