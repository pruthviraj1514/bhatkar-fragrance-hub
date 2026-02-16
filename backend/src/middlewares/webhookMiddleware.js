/**
 * Webhook Body Parser Middleware
 * ==============================
 * Captures raw request body for webhook signature verification
 * 
 * Important: Must be applied BEFORE express.json() middleware
 * Razorpay webhook signature is calculated from raw body (not parsed JSON)
 * 
 * Node.js v22 Compatible - ESM/CommonJS Support
 * Production Safe - Error handling included
 */

const express = require('express');
const { logger } = require('../utils/logger');

/**
 * Capture raw body for webhook signature verification
 * Stores raw body in req.rawBody for use in webhook handlers
 * 
 * CRITICAL: This MUST be applied BEFORE express.json() on webhook routes
 * Uses express.raw() to capture the raw Buffer before JSON parsing
 */
const captureRawBody = express.raw({ type: 'application/json' });

/**
 * Middleware to attach raw body to request
 * Works with express.raw() to preserve body for signature verification
 * 
 * This middleware extracts the raw body from express.raw() middleware
 * and stores it in req.rawBody for Razorpay signature verification
 */
const attachRawBody = (req, res, next) => {
  try {
    // express.raw() stores the raw Buffer in req.body
    if (Buffer.isBuffer(req.body)) {
      // Raw body from express.raw() - convert to UTF-8 string for signature verification
      req.rawBody = req.body.toString('utf8');
      
      // IMPORTANT: Parse the JSON for controller use
      // The signature verification will use req.rawBody (raw string)
      // Normal request handling will use req.body (parsed JSON)
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (parseError) {
        console.error('❌ Failed to parse webhook JSON:', parseError.message);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON in webhook body'
        });
      }
    } else if (typeof req.body === 'string') {
      // Already string (shouldn't happen with express.raw(), but be safe)
      req.rawBody = req.body;
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (parseError) {
        console.error('❌ Failed to parse webhook JSON:', parseError.message);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON in webhook body'
        });
      }
    } else if (typeof req.body === 'object' && req.body !== null) {
      // Body is already parsed object - reconstruct raw
      req.rawBody = JSON.stringify(req.body);
    } else {
      // Empty or unexpected body
      console.warn('⚠️ Webhook received with unexpected body type:', typeof req.body);
      req.rawBody = '';
    }
    
    next();
  } catch (error) {
    console.error('❌ attachRawBody middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Webhook processing failed'
    });
  }
};

module.exports = {
  captureRawBody,
  attachRawBody
};
