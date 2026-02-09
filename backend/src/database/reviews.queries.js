// Reviews database queries
const db = require('../config/db.config');

// Get product reviews (approved only)
const getProductReviews = async (productId) => {
  const query = `
    SELECT id, product_id, reviewer_name, rating, review_text, verified_purchase, created_at
    FROM reviews
    WHERE product_id = ? AND is_approved = 1
    ORDER BY created_at DESC
  `;
  const [reviews] = await db.query(query, [productId]);
  return reviews;
};

// Get review statistics for a product
const getReviewStats = async (productId) => {
  const query = `
    SELECT 
      COUNT(*) as total_reviews,
      ROUND(AVG(rating), 2) as average_rating,
      SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as five_star,
      SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as four_star,
      SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as three_star,
      SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as two_star,
      SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as one_star
    FROM reviews
    WHERE product_id = ? AND is_approved = 1
  `;
  const [stats] = await db.query(query, [productId]);
  return stats[0] || { total_reviews: 0, average_rating: 0 };
};

// Get single review by ID
const getReviewById = async (reviewId) => {
  const query = `
    SELECT id, product_id, reviewer_name, rating, review_text, verified_purchase, created_at
    FROM reviews
    WHERE id = ?
  `;
  const [reviews] = await db.query(query, [reviewId]);
  return reviews[0] || null;
};

// Create a new review
const createReview = async (reviewData) => {
  const query = `
    INSERT INTO reviews (product_id, reviewer_name, rating, review_text, verified_purchase, is_approved)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  const [result] = await db.query(query, [
    reviewData.product_id,
    reviewData.reviewer_name,
    reviewData.rating,
    reviewData.review_text,
    reviewData.verified_purchase || 0,
    1 // Default to approved
  ]);
  return { id: result.insertId, ...reviewData };
};

// Delete a review
const deleteReview = async (reviewId) => {
  const query = `
    DELETE FROM reviews WHERE id = ?
  `;
  const [result] = await db.query(query, [reviewId]);
  return { affectedRows: result.affectedRows };
};

// Get all reviews for a product (including unapproved - for admin)
const getAllProductReviews = async (productId) => {
  const query = `
    SELECT id, product_id, reviewer_name, rating, review_text, verified_purchase, is_approved, created_at
    FROM reviews
    WHERE product_id = ?
    ORDER BY created_at DESC
  `;
  const [reviews] = await db.query(query, [productId]);
  return reviews;
};

// Approve a review (admin)
const approveReview = async (reviewId) => {
  const query = `
    UPDATE reviews SET is_approved = 1 WHERE id = ?
  `;
  const [result] = await db.query(query, [reviewId]);
  return { affectedRows: result.affectedRows };
};

// Reject a review (admin)
const rejectReview = async (reviewId) => {
  const query = `
    UPDATE reviews SET is_approved = 0 WHERE id = ?
  `;
  const [result] = await db.query(query, [reviewId]);
  return { affectedRows: result.affectedRows };
};

module.exports = {
  getProductReviews,
  getReviewStats,
  getReviewById,
  createReview,
  deleteReview,
  getAllProductReviews,
  approveReview,
  rejectReview
};
