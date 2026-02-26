/**
 * PAYMENT CONTROLLER - Production Razorpay Integration
 * =====================================================
 * 
 * Features:
 * - Safe order creation (PENDING status)
 * - Payment verification with HMAC signature
 * - Webhook handlers for async updates
 * - Proper error handling and logging
 * - mysql2 connection pool usage
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const db = require('../config/db');
const { logger } = require('../utils/logger');

// ===== RAZORPAY INSTANCE =====
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===== HELPER FUNCTIONS =====

/**
 * Log payment events to database
 * Usage: For audit trail and debugging
 */
async function logPayment(orderId, paymentId, logType, action, requestData, responseData, statusCode) {
  try {
    await db.query(
      `INSERT INTO payment_logs 
       (order_id, payment_id, log_type, action, request_data, response_data, status_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        orderId || null,
        paymentId || null,
        logType,
        action,
        JSON.stringify(requestData),
        JSON.stringify(responseData),
        statusCode || null,
      ]
    );
  } catch (error) {
    logger.error(`❌ Failed to log payment: ${error.message}`);
    // Don't throw - logging is optional
  }
}

/**
 * Generate unique order number
 * Format: ORD_20260215_ABC123
 */
function generateOrderNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `ORD_${date}_${random}`;
}

/**
 * Verify Razorpay signature
 * CRITICAL: Prevents webhook fraud
 */
function verifyRazorpaySignature(orderId, paymentId, signature) {
  const secret = process.env.RAZORPAY_KEY_SECRET;

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// ===== PAYMENT CONTROLLER METHODS =====

/**
 * CREATE ORDER
 * 
 * Step 1: Create order in orders table (PENDING)
 * Step 2: Create order with Razorpay
 * Step 3: Return razorpay_order_id to frontend
 * 
 * Frontend then creates payment with Razorpay.Checkout modal
 */
exports.createOrder = async (req, res) => {
  let connection;
  try {
    const { productId, quantity, totalAmount } = req.body;

    // ===== VALIDATION =====
    if (!productId || !quantity || !totalAmount) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: productId, quantity, totalAmount',
      });
    }

    if (totalAmount <= 0 || isNaN(totalAmount)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid total amount',
      });
    }

    const amountInPaise = Math.round(totalAmount * 100); // Razorpay uses paise
    const userId = req.user?.id || null; // from auth middleware (nullable for guest)
    const orderNumber = generateOrderNumber();

    console.log(`📦 Creating order: ${orderNumber}, Amount: ₹${totalAmount}`);

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // ===== STEP 1: Create Razorpay Order =====
      console.log(`🔄 Creating Razorpay order...`);
      const razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise, // Amount in paise
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          productId,
          quantity,
        },
      });

      const razorpayOrderId = razorpayOrder.id;
      console.log(`✅ Razorpay order created: ${razorpayOrderId}`);

      // ===== STEP 2: Insert into orders table =====
      console.log(`💾 Saving to database...`);
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
         (user_id, order_number, total_amount, razorpay_order_id, status, items_count)
         VALUES (?, ?, ?, ?, 'PENDING', ?)`,
        [userId, orderNumber, totalAmount, razorpayOrderId, quantity]
      );

      const orderId = orderResult.insertId;

      // ===== STEP 3: Log this action =====
      await logPayment(
        orderId,
        null,
        'API_CALL',
        'create_order',
        { productId, quantity, totalAmount },
        { razorpay_order_id: razorpayOrderId },
        201
      );

      await connection.commit();

      // ===== RETURN TO FRONTEND =====
      console.log(`✅ Order created successfully: ${orderNumber}`);
      res.status(200).json({
        status: 'success',
        message: 'Order created',
        data: {
          orderId,
          order_number: orderNumber,
          razorpay_order_id: razorpayOrderId,
          amount: totalAmount,
          currency: 'INR',
          key_id: process.env.RAZORPAY_KEY_ID, // For Checkout.js
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`❌ Order creation failed:`, error);

    await logPayment(
      null,
      null,
      'ERROR',
      'create_order_failed',
      { error: error.message },
      null,
      500
    );

    res.status(500).json({
      status: 'error',
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

/**
 * VERIFY PAYMENT
 * 
 * Called by frontend after Razorpay payment completes
 * Verifies signature and updates order status
 */
exports.verifyPayment = async (req, res) => {
  let connection;
  try {
    const { orderId, razorpay_payment_id, razorpay_signature } = req.body;

    // ===== VALIDATION =====
    if (!orderId || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing verification details',
      });
    }

    console.log(`🔐 Verifying payment for order: ${orderId}`);

    connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // ===== STEP 1: Get order details =====
      const [orders] = await connection.execute(
        'SELECT * FROM orders WHERE id = ? LIMIT 1',
        [orderId]
      );

      if (orders.length === 0) {
        return res.status(404).json({
          status: 'error',
          message: 'Order not found',
        });
      }

      const order = orders[0];
      const { razorpay_order_id } = order;

      // ===== STEP 2: Verify Razorpay signature =====
      const isValidSignature = verifyRazorpaySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValidSignature) {
        console.error(`❌ Invalid signature for order ${orderId}`);
        return res.status(400).json({
          status: 'error',
          message: 'Payment verification failed - Invalid signature',
        });
      }

      console.log(`✅ Signature verified`);

      // ===== STEP 3: Fetch payment details from Razorpay =====
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      console.log(`📊 Payment status from Razorpay: ${payment.status}`);

      // ===== STEP 4: Insert into payments table =====
      const [paymentResult] = await connection.execute(
        `INSERT INTO payments 
         (order_id, razorpay_payment_id, razorpay_signature, payment_status, payment_method, amount)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          razorpay_payment_id,
          razorpay_signature,
          payment.status === 'captured' ? 'SUCCESS' : payment.status,
          payment.method || 'unknown',
          payment.amount / 100, // Convert from paise to INR
        ]
      );

      // ===== STEP 5: Update order status =====
      if (payment.status === 'captured') {
        await connection.execute(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['PAID', orderId]
        );
        console.log(`✅ Order ${orderId} marked as PAID`);
      } else {
        await connection.execute(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['FAILED', orderId]
        );
        console.log(`❌ Payment not captured for order ${orderId}`);
      }

      // ===== STEP 6: Log payment verification =====
      await logPayment(
        orderId,
        paymentResult.insertId,
        'API_CALL',
        'verify_payment',
        { razorpay_payment_id, razorpay_signature },
        { payment_status: payment.status },
        200
      );

      await connection.commit();

      // ===== RETURN RESPONSE =====
      res.status(200).json({
        status: 'success',
        message: 'Payment verified successfully',
        data: {
          orderId,
          payment_status: payment.status,
          amount: payment.amount / 100,
        },
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error(`❌ Payment verification failed:`, error);

    await logPayment(
      null,
      null,
      'ERROR',
      'verify_payment_failed',
      { error: error.message },
      null,
      500
    );

    res.status(500).json({
      status: 'error',
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  } finally {
    if (connection) {
      await connection.release();
    }
  }
};

/**
 * WEBHOOK HANDLER
 * 
 * Razorpay sends webhook when payment/refund status changes
 * Must verify signature before trusting data
 * 
 * Webhook Events:
 * - payment.authorized (when customer completes payment)
 * - payment.failed (when payment fails)
 * - refund.created (when refund initiated)
 * - refund.processed (when refund completed)
 */
exports.handleWebhook = async (req, res) => {
  try {
    const signature = req.get('X-Razorpay-Signature');
    const body = req.rawBody || JSON.stringify(req.body); // Raw body needed for signature

    // ===== VERIFY WEBHOOK SIGNATURE =====
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error(`❌ Invalid webhook signature`);
      return res.status(400).json({
        status: 'error',
        message: 'Invalid webhook signature',
      });
    }

    console.log(`✅ Webhook signature verified`);

    const event = req.body;
    const eventType = event.event;

    // ===== HANDLE DIFFERENT EVENT TYPES =====
    if (eventType === 'payment.authorized' || eventType === 'payment.captured') {
      console.log(`💳 Payment authorized/captured:`, event.payload.payment.entity.id);

      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.notes?.orderId;

      // Update payment status
      if (orderId) {
        await db.query(
          `UPDATE payments SET payment_status = ? WHERE razorpay_payment_id = ?`,
          ['SUCCESS', paymentId]
        );

        await db.query(
          `UPDATE orders SET status = ? WHERE id = ?`,
          ['PAID', orderId]
        );

        await logPayment(orderId, null, 'WEBHOOK', 'payment_captured', event, null, 200);
      }
    } else if (eventType === 'payment.failed') {
      console.log(`❌ Payment failed:`, event.payload.payment.entity.id);

      const payment = event.payload.payment.entity;
      const paymentId = payment.id;
      const orderId = payment.notes?.orderId;

      // Update payment status
      if (orderId) {
        await db.query(
          `UPDATE payments SET payment_status = ?, error_code = ?, error_message = ? 
           WHERE razorpay_payment_id = ?`,
          ['FAILED', payment.error_code || null, payment.error_description || null, paymentId]
        );

        await db.query(
          `UPDATE orders SET status = ? WHERE id = ?`,
          ['FAILED', orderId]
        );

        await logPayment(orderId, null, 'WEBHOOK', 'payment_failed', event, null, 200);
      }
    } else if (eventType === 'refund.created' || eventType === 'refund.processed') {
      console.log(`💰 Refund processed:`, event.payload.refund.entity.id);

      const refund = event.payload.refund.entity;
      const paymentId = refund.payment_id;

      // Get order ID from payment
      const [payments] = await db.query(
        'SELECT order_id FROM payments WHERE razorpay_payment_id = ?',
        [paymentId]
      );

      if (payments.length > 0) {
        const orderId = payments[0].order_id;

        // Insert refund record
        await db.query(
          `INSERT INTO refunds (payment_id, razorpay_refund_id, refund_amount, refund_status)
           VALUES (?, ?, ?, 'PROCESSED')`,
          [payments[0].id, refund.id, refund.amount / 100]
        );

        // Update order status
        await db.query(
          `UPDATE orders SET status = ? WHERE id = ?`,
          ['REFUNDED', orderId]
        );

        await logPayment(orderId, payments[0].id, 'WEBHOOK', 'refund_processed', event, null, 200);
      }
    }

    // ===== ACKNOWLEDGE WEBHOOK =====
    res.status(200).json({
      status: 'ok',
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error(`❌ Webhook handler error:`, error);

    await logPayment(
      null,
      null,
      'ERROR',
      'webhook_failed',
      { error: error.message },
      null,
      500
    );

    // Always return 200 to Razorpay (to avoid retries)
    res.status(200).json({
      status: 'error',
      message: 'Webhook processing failed',
    });
  }
};

/**
 * GET ORDER STATUS
 * Fetch current order and payment status
 */
exports.getOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found',
      });
    }

    const order = orders[0];

    // Get latest payment
    const [payments] = await db.query(
      'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC LIMIT 1',
      [orderId]
    );

    res.status(200).json({
      status: 'success',
      data: {
        ...order,
        payment: payments.length > 0 ? payments[0] : null,
      },
    });
  } catch (error) {
    console.error(`❌ Failed to get order status:`, error);

    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = exports;
