const router = require('express').Router();
const { asyncHandler } = require('../middlewares/asyncHandler');
const adminAuth = require('../middlewares/adminAuth');
const variantController = require('../controllers/productVariant.controller');

// Get all variants for a product (public)
router.get('/product/:productId', asyncHandler(variantController.getProductVariants));

// Get single variant (public)
router.get('/:variantId', asyncHandler(variantController.getVariant));

// Admin only routes
// Create variant for product
router.post('/product/:productId', adminAuth, asyncHandler(variantController.createVariant));

// Update variant
router.put('/:variantId', adminAuth, asyncHandler(variantController.updateVariant));

// Delete variant
router.delete('/:variantId', adminAuth, asyncHandler(variantController.deleteVariant));

module.exports = router;
