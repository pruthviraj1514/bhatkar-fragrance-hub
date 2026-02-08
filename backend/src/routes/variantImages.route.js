const express = require('express');
const router = express.Router();
const variantImagesController = require('../controllers/variantImages.controller');
const adminAuth = require('../middlewares/adminAuth');
const asyncHandler = require('../middlewares/asyncHandler');

// Public endpoints
// Get all images for a variant (used for product detail page image switching)
router.get('/:variantId', asyncHandler(variantImagesController.getVariantImages));

// Admin endpoints
// Add images to a variant
router.post('/:variantId', adminAuth, asyncHandler(variantImagesController.addVariantImages));

// Delete variant image
router.delete('/:imageId', adminAuth, asyncHandler(variantImagesController.deleteVariantImage));

module.exports = router;
