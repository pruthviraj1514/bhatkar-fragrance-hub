const { asyncHandler } = require('../middlewares/asyncHandler');
const reviewsQueries = require('../database/reviews.queries');
const logger = require('../utils/logger');

// Get all reviews for a product
exports.getProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).send({
            status: 'error',
            message: 'Product ID is required'
        });
    }

    const reviews = await reviewsQueries.getProductReviews(productId);
    logger.info(`Retrieved reviews for product: ${productId}`);

    return res.status(200).send({
        status: 'success',
        data: reviews
    });
});

// Get review statistics for a product
exports.getReviewStats = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).send({
            status: 'error',
            message: 'Product ID is required'
        });
    }

    const stats = await reviewsQueries.getReviewStats(productId);
    logger.info(`Retrieved review stats for product: ${productId}`);

    return res.status(200).send({
        status: 'success',
        data: stats
    });
});

// Get all reviews for a product (admin) including unapproved
exports.getAllProductReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!productId) return res.status(400).send({ status: 'error', message: 'Product ID is required' });

    const reviews = await reviewsQueries.getAllProductReviews(productId);
    logger.info(`Retrieved all reviews (admin) for product: ${productId}`);
    return res.status(200).send({ status: 'success', data: reviews });
});

// Create a new review
exports.createReview = asyncHandler(async (req, res) => {
    const productIdFromUrl = req.params.productId;
    // Support both URL params and body
    const productId_ = productIdFromUrl || product_id || productId;

    // Strict type parsing
    const pid = Number(productId_);
    const rtg = Number(rating);

    // DEBUG LOGS
    console.log(`[Review Debug] Types: pid=${typeof pid}(${pid}), rating=${typeof rtg}(${rtg}), reviewer=${reviewer_name}`);

    if (isNaN(pid) || isNaN(rtg)) {
        return res.status(400).send({
            status: 'error',
            message: 'Product ID and Rating must be valid numbers'
        });
    }

    if (rtg < 1 || rtg > 5) {
        return res.status(400).send({
            status: 'error',
            message: 'Rating must be between 1 and 5'
        });
    }

    const reviewData = {
        product_id: pid,
        reviewer_name: String(reviewer_name),
        rating: rtg,
        review_text: String(review_text),
        verified_purchase: verified_purchase === true || verified_purchase === 'true' || verified_purchase === 1,
        is_approved: is_approved !== undefined ? (is_approved === true || is_approved === 'true' || is_approved === 1) : true,
        is_active: is_active !== undefined ? (is_active === true || is_active === 'true' || is_active === 1) : true
    };

    const review = await reviewsQueries.createReview(reviewData);
    logger.info(`Review created for product: ${productId_}`);

    return res.status(201).send({
        status: 'success',
        message: 'Review created successfully',
        data: review
    });
});

// Delete a review (admin only)
exports.deleteReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId) {
        return res.status(400).send({
            status: 'error',
            message: 'Review ID is required'
        });
    }

    const result = await reviewsQueries.deleteReview(reviewId);
    logger.info(`Review deleted: ${reviewId}`);

    return res.status(200).send({
        status: 'success',
        message: 'Review deleted successfully',
        data: result
    });
});

// Get review by ID
exports.getReviewById = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;

    if (!reviewId) {
        return res.status(400).send({
            status: 'error',
            message: 'Review ID is required'
        });
    }

    const review = await reviewsQueries.getReviewById(reviewId);

    if (!review) {
        return res.status(404).send({
            status: 'error',
            message: 'Review not found'
        });
    }

    logger.info(`Retrieved review: ${reviewId}`);
    return res.status(200).send({
        status: 'success',
        data: review
    });
});

// Get featured reviews for product (public)
exports.getFeaturedReviews = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!productId) {
        return res.status(400).send({ status: 'error', message: 'Product ID is required' });
    }

    const reviews = await reviewsQueries.getFeaturedReviews(productId);
    logger.info(`Retrieved featured reviews for product: ${productId}`);

    return res.status(200).send({ status: 'success', data: reviews });
});

// Update review (admin) - edit content, rating, verified_purchase
exports.updateReview = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { reviewer_name, rating, review_text, verified_purchase } = req.body;

    if (!reviewId) return res.status(400).send({ status: 'error', message: 'Review ID is required' });

    const existing = await reviewsQueries.getReviewById(reviewId);
    if (!existing) return res.status(404).send({ status: 'error', message: 'Review not found' });

    const pid = Number(reviewId);
    const rtg = rating !== undefined ? Number(rating) : undefined;

    if (isNaN(pid)) return res.status(400).send({ status: 'error', message: 'Invalid Review ID' });

    const query = `UPDATE reviews SET reviewer_name = $1, rating = $2, review_text = $3, verified_purchase = $4 WHERE id = $5`;
    await require('../config/db').query(query, [
        reviewer_name || existing.reviewer_name,
        rtg !== undefined && !isNaN(rtg) ? rtg : existing.rating,
        review_text || existing.review_text,
        verified_purchase !== undefined ? (verified_purchase === true || verified_purchase === 'true' || verified_purchase === 1) : existing.verified_purchase,
        pid
    ]);

    const updated = await reviewsQueries.getReviewById(reviewId);
    logger.info(`Review updated: ${reviewId}`);
    return res.status(200).send({ status: 'success', data: updated });
});

// Set featured flag (admin)
exports.setFeatured = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { featured } = req.body;
    if (!reviewId) return res.status(400).send({ status: 'error', message: 'Review ID is required' });

    await reviewsQueries.setFeatured(reviewId, featured ? 1 : 0);
    logger.info(`Review ${reviewId} featured set to ${featured}`);
    return res.status(200).send({ status: 'success', message: 'Featured flag updated' });
});

// Set active/inactive (admin)
exports.setActive = asyncHandler(async (req, res) => {
    const { reviewId } = req.params;
    const { active } = req.body;
    if (!reviewId) return res.status(400).send({ status: 'error', message: 'Review ID is required' });

    await reviewsQueries.setActive(reviewId, active ? 1 : 0);
    logger.info(`Review ${reviewId} active set to ${active}`);
    return res.status(200).send({ status: 'success', message: 'Active flag updated' });
});

// Check product has minimum active reviews (returns count and ok boolean)
exports.checkProductReviewsMinimum = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    if (!productId) return res.status(400).send({ status: 'error', message: 'Product ID is required' });

    const stats = await reviewsQueries.getReviewStats(productId);
    const count = stats.total_reviews || 0;
    const ok = count >= 2;
    return res.status(200).send({ status: 'success', data: { total_reviews: count, ok } });
});
