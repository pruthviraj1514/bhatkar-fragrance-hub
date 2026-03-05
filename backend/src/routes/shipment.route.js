const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middlewares/asyncHandler');
const adminAuth = require('../middlewares/adminAuth');
const shipmentController = require('../controllers/shipment.controller');

// configuration check
router.get('/config', adminAuth, (req, res) => {
  if (!process.env.SHIPROCKET_EMAIL || !process.env.SHIPROCKET_PASSWORD) {
    return res.status(200).json({
      configured: false,
      message: 'SHIPROCKET_EMAIL or SHIPROCKET_PASSWORD not set'
    });
  }
  return res.status(200).json({ configured: true });
});

// Create shipment for an order (admin only)
router.post('/create/:id', adminAuth, asyncHandler(shipmentController.createShipmentForOrder));

module.exports = router;
