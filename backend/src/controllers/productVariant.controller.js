const db = require('../config/db.config');
const variantQueries = require('../database/productVariants.queries');
const logger = require('../utils/logger');

// Get all variants for a product
exports.getProductVariants = (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    return res.status(400).json({
      status: 'error',
      message: 'Product ID is required'
    });
  }

  db.query(variantQueries.getVariantsByProductId, [productId], (err, results) => {
    if (err) {
      logger.error(`Error fetching variants: ${err.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch variants'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: results || [],
      total: results ? results.length : 0
    });
  });
};

// Get single variant
exports.getVariant = (req, res) => {
  const { variantId } = req.params;

  if (!variantId) {
    return res.status(400).json({
      status: 'error',
      message: 'Variant ID is required'
    });
  }

  db.query(variantQueries.getVariantById, [variantId], (err, results) => {
    if (err) {
      logger.error(`Error fetching variant: ${err.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to fetch variant'
      });
    }

    if (!results || results.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Variant not found'
      });
    }

    return res.status(200).json({
      status: 'success',
      data: results[0]
    });
  });
};

// Create variant for a product
exports.createVariant = (req, res) => {
  const { productId } = req.params;
  const { variant_name, variant_value, variant_unit, price, stock } = req.body;

  // Validation
  if (!productId || !variant_name || !variant_value || !price || stock === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields: variant_name, variant_value, price, stock'
    });
  }

  const unit = variant_unit || 'ml';
  const isActive = true;

  db.query(
    variantQueries.createVariant,
    [productId, variant_name, variant_value, unit, price, stock, isActive],
    (err, result) => {
      if (err) {
        logger.error(`Error creating variant: ${err.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to create variant',
          error: err.message
        });
      }

      return res.status(201).json({
        status: 'success',
        message: 'Variant created successfully',
        data: {
          id: result.insertId,
          product_id: productId,
          variant_name,
          variant_value,
          variant_unit: unit,
          price,
          stock
        }
      });
    }
  );
};

// Update variant
exports.updateVariant = (req, res) => {
  const { variantId } = req.params;
  const { variant_name, variant_value, variant_unit, price, stock, is_active } = req.body;

  if (!variantId) {
    return res.status(400).json({
      status: 'error',
      message: 'Variant ID is required'
    });
  }

  if (!variant_name || !variant_value || price === undefined || stock === undefined) {
    return res.status(400).json({
      status: 'error',
      message: 'Missing required fields'
    });
  }

  const unit = variant_unit || 'ml';
  const active = is_active !== undefined ? is_active : 1;

  db.query(
    variantQueries.updateVariant,
    [variant_name, variant_value, unit, price, stock, active, variantId],
    (err, result) => {
      if (err) {
        logger.error(`Error updating variant: ${err.message}`);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to update variant'
        });
      }

      return res.status(200).json({
        status: 'success',
        message: 'Variant updated successfully',
        data: { id: variantId }
      });
    }
  );
};

// Delete variant
exports.deleteVariant = (req, res) => {
  const { variantId } = req.params;

  if (!variantId) {
    return res.status(400).json({
      status: 'error',
      message: 'Variant ID is required'
    });
  }

  db.query(variantQueries.deleteVariant, [variantId], (err, result) => {
    if (err) {
      logger.error(`Error deleting variant: ${err.message}`);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to delete variant'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Variant deleted successfully'
    });
  });
};
