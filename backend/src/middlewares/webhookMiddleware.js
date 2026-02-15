/**
 * Webhook Body Parser Middleware
 * ==============================
 * Captures raw request body for webhook signature verification
 * 
 * Important: Must be applied BEFORE express.json() middleware
 * Razorpay webhook signature is calculated from raw body (not parsed JSON)
 */

const { logger } = require('../utils/logger');

/**
 * Capture raw body for webhook signature verification
 * Stores raw body in req.rawBody for use in webhook handlers
 */
const captureRawBody = express.raw({ type: 'application/json' });

/**
 * Middleware to attach raw body to request
 * Works with express.raw() to preserve body for signature verification
 */
const attachRawBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object' && !(req.body instanceof Buffer)) {
    // If body is already parsed, store original raw
    req.rawBody = JSON.stringify(req.body);
  } else if (Buffer.isBuffer(req.body)) {
    // If body is buffer (from express.raw()), keep it
    req.rawBody = req.body.toString('utf8');
  }
  next();
};

module.exports = {
  captureRawBody,
  attachRawBody
};
