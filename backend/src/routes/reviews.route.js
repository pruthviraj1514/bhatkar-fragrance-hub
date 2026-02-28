const express = require('express');
const reviewsController = require('../controllers/reviews.controller');
const adminAuth = require('../middlewares/adminAuth');

const router = express.Router();

// Get all reviews for a product - PUBLIC
router.get('/product/:productId', reviewsController.getProductReviews);

// Get review statistics for a product - PUBLIC
router.get('/stats/:productId', reviewsController.getReviewStats);

// Get featured reviews (public)
router.get('/product/:productId/featured', reviewsController.getFeaturedReviews);

// Get all reviews for a product (public now per instructions)
router.get('/product/:productId/all', reviewsController.getAllProductReviews);

// Get single review by ID - PUBLIC
router.get('/:reviewId', reviewsController.getReviewById);

// Create a new review - PUBLIC (via URL params)
router.post('/product/:productId', reviewsController.createReview);

// Create a new review - PUBLIC (via body - for admin bulk creation)  
router.post('/', reviewsController.createReview);

// Check if product meets minimum active reviews (public)
router.get('/product/:productId/check-minimum', reviewsController.checkProductReviewsMinimum);

// Update a review - ADMIN ONLY
router.put('/:reviewId', adminAuth, reviewsController.updateReview);

// Set featured flag - ADMIN ONLY
router.patch('/:reviewId/featured', adminAuth, reviewsController.setFeatured);

// Set active flag - ADMIN ONLY
router.patch('/:reviewId/active', adminAuth, reviewsController.setActive);

// Delete a review - ADMIN ONLY
router.delete('/:reviewId', adminAuth, reviewsController.deleteReview);

module.exports = router;
