const express = require('express');
const router = express.Router();

const adminController = require('../controllers/admin.controller');
const adminValidator = require('../validators/admin');
const adminAuth = require('../middlewares/adminAuth');

/**
 * Public Routes
 */

// Admin Login - POST /api/admin/login
router.post('/login', adminValidator.login, adminController.login);

/**
 * Protected Routes (Require Admin Authentication)
 */

// Get Admin Profile - GET /api/admin/profile
router.get('/profile', adminAuth, adminController.getProfile);

// Admin Logout - POST /api/admin/logout
router.post('/logout', adminAuth, adminController.logout);

/**
 * Product Management (CRUD)
 */

// Create Product - POST /api/admin/products
router.post('/products', adminAuth, adminController.createProduct);

// Get All Products - GET /api/admin/products
router.get('/products', adminAuth, adminController.getAllProducts);

// Get Product by ID - GET /api/admin/products/:id
router.get('/products/:id', adminAuth, adminController.getProductById);

// Update Product - PUT /api/admin/products/:id
router.put('/products/:id', adminAuth, adminController.updateProduct);

// Delete Product - DELETE /api/admin/products/:id
router.delete('/products/:id', adminAuth, adminController.deleteProduct);

/**
 * Price & Photos Management 
 * Note: These are mapped to Variants and ProductImages in the current architecture.
 * Reusing existing endpoints is recommended.
 */
// ... (Keeping existing placeholders or wiring to corresponding controllers)

/**
 * Price Management (CRUD)
 */

// Create Price - POST /api/admin/prices
router.post('/prices', adminAuth, (req, res) => {
    // TODO: Implement price creation
    res.status(200).send({
        status: 'success',
        message: 'Price creation endpoint (not yet implemented)'
    });
});

// Get All Prices - GET /api/admin/prices
router.get('/prices', adminAuth, (req, res) => {
    // TODO: Implement get all prices
    res.status(200).send({
        status: 'success',
        message: 'Get all prices endpoint (not yet implemented)',
        data: []
    });
});

// Get Price by ID - GET /api/admin/prices/:id
router.get('/prices/:id', adminAuth, (req, res) => {
    // TODO: Implement get price by ID
    res.status(200).send({
        status: 'success',
        message: 'Get price by ID endpoint (not yet implemented)',
        data: {}
    });
});

// Update Price - PUT /api/admin/prices/:id
router.put('/prices/:id', adminAuth, (req, res) => {
    // TODO: Implement price update
    res.status(200).send({
        status: 'success',
        message: 'Price update endpoint (not yet implemented)'
    });
});

// Delete Price - DELETE /api/admin/prices/:id
router.delete('/prices/:id', adminAuth, (req, res) => {
    // TODO: Implement price deletion
    res.status(200).send({
        status: 'success',
        message: 'Price deletion endpoint (not yet implemented)'
    });
});

/**
 * Photo Management (CRUD)
 */

// Create Photo - POST /api/admin/photos
router.post('/photos', adminAuth, (req, res) => {
    // TODO: Implement photo creation
    res.status(200).send({
        status: 'success',
        message: 'Photo creation endpoint (not yet implemented)'
    });
});

// Get All Photos - GET /api/admin/photos
router.get('/photos', adminAuth, (req, res) => {
    // TODO: Implement get all photos
    res.status(200).send({
        status: 'success',
        message: 'Get all photos endpoint (not yet implemented)',
        data: []
    });
});

// Get Photo by ID - GET /api/admin/photos/:id
router.get('/photos/:id', adminAuth, (req, res) => {
    // TODO: Implement get photo by ID
    res.status(200).send({
        status: 'success',
        message: 'Get photo by ID endpoint (not yet implemented)',
        data: {}
    });
});

// Update Photo - PUT /api/admin/photos/:id
router.put('/photos/:id', adminAuth, (req, res) => {
    // TODO: Implement photo update
    res.status(200).send({
        status: 'success',
        message: 'Photo update endpoint (not yet implemented)'
    });
});

// Delete Photo - DELETE /api/admin/photos/:id
router.delete('/photos/:id', adminAuth, (req, res) => {
    // TODO: Implement photo deletion
    res.status(200).send({
        status: 'success',
        message: 'Photo deletion endpoint (not yet implemented)'
    });
});

module.exports = router;
