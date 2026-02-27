/**
 * Payment Service
 * ===============
 * Handles order creation, payment verification, and webhook processing
 * All business logic for Razorpay integration
 */

const razorpay = require('../config/razorpay');
const db = require('../config/db');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

class PaymentService {
  /**
   * Create Payment Order
   * - Fetch product price securely from DB
   * - Calculate total amount
   * - Create Razorpay order
   * - Save order in database with PENDING status
   */
  async createOrder(userId, productId, quantity = 1, contact = null) {
    const conn = await db.getConnection();

    try {
      // PostgreSQL: No explicit transaction needed for single inserts if not complex, 
      // but keeping for consistency with original logic.
      await conn.query('BEGIN');

      // 1. Fetch product price from database (NEVER from frontend)
      const [productRows] = await conn.query(
        'SELECT id, name, price FROM products WHERE id = $1 AND is_active = true',
        [productId]
      );

      if (!productRows || productRows.length === 0) {
        throw new Error('Product not found or inactive');
      }

      const product = productRows[0];
      const unitPrice = parseFloat(product.price);
      const totalAmount = unitPrice * quantity;

      // Validate amount
      if (totalAmount <= 0 || totalAmount > 1000000) {
        throw new Error('Invalid order amount');
      }

      // 2. Create Razorpay order (amount in paise)
      const razorpayOrder = await razorpay.orders.create({
        amount: Math.round(totalAmount * 100), // Convert to paise
        currency: 'INR',
        receipt: `order_${Date.now()}_${userId}_${productId}`,
        payment_capture: 1, // Auto-capture payment
        notes: Object.assign({
          userId,
          productId,
          productName: product.name
        }, contact ? { contact } : {})
      });

      // 3. Save order in database
      // Using RETURNING * to get the SERIAL id
      const [result] = await conn.query(
        `INSERT INTO orders (user_id, product_id, quantity, total_amount, razorpay_order_id, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
        [userId, productId, quantity, totalAmount, razorpayOrder.id, 'PENDING']
      );

      await conn.query('COMMIT');

      const orderId = result.id;
      logger.info(`✅ Order created - Order ID: ${orderId}, Razorpay: ${razorpayOrder.id}, Amount: ₹${totalAmount}`);

      return {
        success: true,
        orderId: orderId,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        productName: product.name
      };
    } catch (error) {
      await conn.query('ROLLBACK');
      logger.error('❌ Error creating order:', error.message);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Verify Payment
   * - Validate Razorpay signature
   * - Update order status to PAID
   * - Save payment details
   * - Prevent duplicate payments
   */
  async verifyPayment(orderId, razorpayPaymentId, razorpaySignature) {
    const conn = await db.getConnection();

    try {
      await conn.query('BEGIN');

      // 1. Fetch order from database
      const [orderRows] = await conn.query(
        'SELECT id, razorpay_order_id, status, total_amount FROM orders WHERE id = $1',
        [orderId]
      );

      if (!orderRows || orderRows.length === 0) {
        throw new Error('Order not found');
      }

      const order = orderRows[0];

      // 2. Prevent duplicate payment verification
      if (order.status === 'PAID') {
        throw new Error('Order already paid');
      }

      if (order.status === 'FAILED') {
        throw new Error('Order is marked as failed');
      }

      // 3. Verify Razorpay signature using crypto (HMAC-SHA256)
      const generatedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(order.razorpay_order_id + '|' + razorpayPaymentId)
        .digest('hex');

      if (generatedSignature !== razorpaySignature) {
        logger.error('❌ Signature verification failed for order:', orderId);
        throw new Error('Payment signature verification failed');
      }

      // 4. Save payment details
      const [paymentResult] = await conn.query(
        `INSERT INTO payments (order_id, razorpay_payment_id, razorpay_signature, payment_status, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [orderId, razorpayPaymentId, razorpaySignature, 'SUCCESS']
      );

      // 5. Update order status to PAID
      await conn.query('UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2', ['PAID', orderId]);

      await conn.query('COMMIT');

      logger.info(`✅ Payment verified - Order: ${orderId}, Payment ID: ${razorpayPaymentId}, Amount: ₹${order.total_amount}`);

      return {
        success: true,
        message: 'Payment verified successfully',
        orderId,
        paymentId: paymentResult.id
      };
    } catch (error) {
      await conn.query('ROLLBACK');
      logger.error('❌ Error verifying payment:', error.message);
      throw error;
    } finally {
      conn.release();
    }
  }

  /**
   * Handle Razorpay Webhook
   * - Validate webhook signature
   * - Process payment events
   * - Update order/payment status
   */
  async handleWebhook(payload, signature) {
    try {
      // 1. Validate webhook signature
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (expectedSignature !== signature) {
        logger.error('❌ Invalid webhook signature');
        throw new Error('Invalid webhook signature');
      }

      // 2. Process different event types
      const event = payload.event;
      const conn = await db.getConnection();

      switch (event) {
        case 'payment.captured':
          await this._handlePaymentCaptured(payload, conn);
          break;
        case 'payment.failed':
          await this._handlePaymentFailed(payload, conn);
          break;
        case 'order.paid':
          await this._handleOrderPaid(payload, conn);
          break;
        default:
          logger.info(`⚠️ Unhandled webhook event: ${event}`);
      }

      conn.release();
      logger.info(`✅ Webhook processed - Event: ${event}`);
      return { success: true };
    } catch (error) {
      logger.error('❌ Error handling webhook:', error.message);
      throw error;
    }
  }

  /**
   * Helper: Handle payment captured event
   */
  async _handlePaymentCaptured(payload, conn) {
    const paymentData = payload.payload.payment.entity;
    const razorpayOrderId = paymentData.order_id;
    const razorpayPaymentId = paymentData.id;

    const [orderRows] = await conn.query(
      'SELECT id FROM orders WHERE razorpay_order_id = $1',
      [razorpayOrderId]
    );

    if (orderRows.length > 0) {
      await conn.query(
        `UPDATE payments SET payment_status = $1, updated_at = NOW() WHERE razorpay_payment_id = $2`,
        ['SUCCESS', razorpayPaymentId]
      );
    }
  }

  /**
   * Helper: Handle payment failed event
   */
  async _handlePaymentFailed(payload, conn) {
    const paymentData = payload.payload.payment.entity;
    const razorpayOrderId = paymentData.order_id;

    const [orderRows] = await conn.query(
      'SELECT id FROM orders WHERE razorpay_order_id = $1',
      [razorpayOrderId]
    );

    if (orderRows.length > 0) {
      await conn.query(
        'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
        ['FAILED', orderRows[0].id]
      );
    }
  }

  /**
   * Helper: Handle order paid event
   */
  async _handleOrderPaid(payload, conn) {
    const orderData = payload.payload.order.entity;
    const razorpayOrderId = orderData.id;

    await conn.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE razorpay_order_id = $2 AND status = $3',
      ['PAID', razorpayOrderId, 'PENDING']
    );
  }

  /**
   * Get Order Details
   */
  async getOrderDetails(orderId) {
    const [rows] = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (!rows || rows.length === 0) {
      throw new Error('Order not found');
    }

    return rows[0];
  }

  /**
   * Get Payment Details
   */
  async getPaymentDetails(paymentId) {
    const [rows] = await db.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );

    if (!rows || rows.length === 0) {
      throw new Error('Payment not found');
    }

    return rows[0];
  }
}

module.exports = new PaymentService();
