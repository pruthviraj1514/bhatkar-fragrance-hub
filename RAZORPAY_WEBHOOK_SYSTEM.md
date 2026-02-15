# Razorpay Webhook System - Complete Implementation Guide

## 📋 Overview

This document provides a complete, production-ready implementation of Razorpay webhook handling for your ecommerce platform. The webhook system automatically updates order status in MySQL when payment events occur.

---

## 🏗️ Architecture

```
Razorpay Payment Gateway
        ↓
  (Payment Event)
        ↓
POST /api/payment/webhook
        ↓
✓ Signature Verification (HMAC SHA256)
✓ Event Parsing
✓ Database Update
✓ Logging & Monitoring
        ↓
HTTP 200 OK Response
(Immediate, async processing)
```

---

## 📁 File Structure

```
backend/src/
├── controllers/
│   ├── paymentController.js          (HTTP handlers)
│   └── paymentWebhookController.js   (Webhook business logic)
├── services/
│   └── paymentService.js             (Service layer with webhook handling)
├── models/
│   └── orderModel.js                 (Database operations)
├── routes/
│   └── paymentRoutes.js              (API endpoints)
├── middlewares/
│   └── webhookMiddleware.js          (Raw body capture for signature verification)
├── config/
│   └── razorpay.js                   (Razorpay initialization)
└── database/
    └── razorpay_schema.sql           (Database schema with indexes)
```

---

## 🔐 Security Features

### 1. **HMAC SHA256 Signature Verification**

All webhooks are signed by Razorpay using your webhook secret:

```javascript
// Signature calculation (same as Razorpay does)
const crypto = require('crypto');
const signature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(rawBody)  // Must be raw request body, not parsed JSON
  .digest('hex');
```

**Why this matters:**
- Prevents webhook spoofing
- Validates request comes from Razorpay
- Uses timing-safe comparison to prevent timing attacks

### 2. **Raw Body Preservation**

**Critical:** The webhook signature is calculated from the **raw request body**, not parsed JSON.

```javascript
// ✓ CORRECT - express.raw() preserves raw body
router.post('/webhook', express.raw({ type: 'application/json' }), handler);

// ✗ WRONG - express.json() parses body, breaks signature verification
router.post('/webhook', express.json(), handler);
```

### 3. **Idempotency Checks**

Prevents duplicate processing if Razorpay retries webhook:

```javascript
// Check if order already has status PAID
const existingOrder = await OrderModel.getByRazorpayOrderId(razorpayOrderId);
if (existingOrder && existingOrder.status === 'PAID') {
  logger.warn('Order already PAID - skipping duplicate');
  return { processed: false, reason: 'duplicate' };
}
```

### 4. **Timing-Safe Comparison**

Prevents timing attacks on signature verification:

```javascript
// ✓ CORRECT - timing-safe comparison
crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(received));

// ✗ WRONG - vulnerable to timing attacks
if (expected === received) { ... }
```

### 5. **Environment Variables**

All secrets stored in environment, never hardcoded:

```bash
# .env
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
RAZORPAY_WEBHOOK_SECRET=Bhatkar@3110
RAZORPAY_WEBHOOK_URL=https://yourdomain.com/api/payment/webhook
```

---

## 💾 Database Schema

### Orders Table

```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  total_amount DECIMAL(10, 2) NOT NULL,
  razorpay_order_id VARCHAR(50) UNIQUE NOT NULL,
  status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for fast lookups during webhook processing
  INDEX idx_user_id (user_id),
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  -- Foreign keys for referential integrity
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Payments Table

```sql
CREATE TABLE payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  razorpay_payment_id VARCHAR(50) UNIQUE NOT NULL,
  razorpay_signature VARCHAR(128),
  payment_status ENUM('captured', 'failed', 'pending') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for fast lookups
  INDEX idx_order_id (order_id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at),
  
  -- Foreign key
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

### Index Strategy

| Index | Type | Purpose | Query Performance |
|-------|------|---------|-------------------|
| `idx_razorpay_order_id` | Unique | Fast webhook lookup | O(1) |
| `idx_status` | Regular | Filter orders by status | O(1) |
| `idx_user_id` | Regular | User's order history | O(log n) |
| `idx_created_at` | Regular | Recent orders, analytics | O(log n) |
| `idx_razorpay_payment_id` | Unique | Payment lookup | O(1) |

---

## 📝 SQL Queries for Webhooks

### 1. Update Order Status (from Webhook)

```sql
-- Called when payment.captured event received
UPDATE orders
SET status = 'PAID', updated_at = NOW()
WHERE razorpay_order_id = ?;

-- Returns: Rows affected (0 if order not found)
```

### 2. Mark Order as Failed

```sql
-- Called when payment.failed event received
UPDATE orders
SET status = 'FAILED', updated_at = NOW()
WHERE razorpay_order_id = ?;
```

### 3. Mark Order as Refunded

```sql
-- Called when refund.processed event received
UPDATE orders
SET status = 'REFUNDED', updated_at = NOW()
WHERE razorpay_order_id = ?;
```

### 4. Idempotency Check - Get Order by Razorpay ID

```sql
-- Check if order already exists to prevent duplicates
SELECT id, status FROM orders
WHERE razorpay_order_id = ?
LIMIT 1;

-- Returns: Order record if exists, else NULL
```

### 5. Get Current Order Status

```sql
-- Verify order state before updating
SELECT id, razorpay_order_id, status
FROM orders
WHERE razorpay_order_id = ?;

-- Use: Prevent PENDING→PAID→FAILED transitions
```

### 6. Analytics - Payment Success Rate

```sql
-- Calculate payment success metrics
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_orders,
  ROUND(100.0 * SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM orders
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 7. Webhook Processing Log Query

```sql
-- Track webhook processing with timestamps
SELECT
  o.id,
  o.razorpay_order_id,
  o.status,
  p.razorpay_payment_id,
  p.payment_status,
  p.created_at as webhook_received_at,
  o.updated_at as status_updated_at,
  TIMESTAMPDIFF(SECOND, p.created_at, o.updated_at) as processing_time_sec
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY p.created_at DESC;
```

---

## 🚀 Webhook Events Handled

### 1. **payment.captured** ✅ Order → PAID

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxx",
        "order_id": "order_xxxxx",
        "amount": 5000,
        "status": "captured"
      }
    }
  }
}
```

**Action:**
```javascript
UPDATE orders SET status = 'PAID', updated_at = NOW()
WHERE razorpay_order_id = ?
```

### 2. **payment.failed** ❌ Order → FAILED

```json
{
  "event": "payment.failed",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_xxxxx",
        "order_id": "order_xxxxx",
        "description": "Payment declined"
      }
    }
  }
}
```

**Action:**
```javascript
UPDATE orders SET status = 'FAILED', updated_at = NOW()
WHERE razorpay_order_id = ?
```

### 3. **refund.processed** 💰 Order → REFUNDED

```json
{
  "event": "refund.processed",
  "payload": {
    "refund": {
      "entity": {
        "id": "rfnd_xxxxx",
        "payment_id": "pay_xxxxx",
        "order_id": "order_xxxxx",
        "amount": 5000
      }
    }
  }
}
```

**Action:**
```javascript
UPDATE orders SET status = 'REFUNDED', updated_at = NOW()
WHERE razorpay_order_id = ?
```

---

## ⚙️ Configuration

### .env Variables

```bash
# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_test_SG2Tx6WI4tXjVc
RAZORPAY_KEY_SECRET=QM7kZJM8nnHGjFX62N038cLZ

# Webhook Signature Secret (set in Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET=Bhatkar@3110

# Webhook URL (for reference, configured in Razorpay Dashboard)
RAZORPAY_WEBHOOK_URL=https://bhatkar-fragrance-hub-1.onrender.com/api/payment/webhook

# Database
DB_HOST=shinkansen.proxy.rlwy.net
DB_PORT=11735
DB_USER=root
DB_PASS=your_password
DB_NAME=railway
```

### Razorpay Dashboard Setup

1. Go to **Settings → Webhooks**
2. Click **Add Webhook**
3. Enter webhook URL:
   ```
   https://yourdomain.com/api/payment/webhook
   ```
4. Select events:
   - ✓ payment.captured
   - ✓ payment.failed
   - ✓ refund.processed
5. Copy webhook secret to `.env`
6. Save

---

## 🧪 Testing Webhooks

### Using Razorpay CLI

```bash
# Test webhook with Razorpay CLI
razorpay webhooks trigger payment.captured \
  --webhook-id webhook_xxxxx \
  --environment test
```

### Using cURL (Manual Test)

```bash
# 1. Generate test signature
# secret = "Bhatkar@3110"
# body = test JSON payload

# 2. Send webhook
curl -X POST https://yourdomain.com/api/payment/webhook \
  -H "x-razorpay-signature: YOUR_SIGNATURE_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.captured",
    "payload": {
      "payment": {
        "entity": {
          "id": "pay_test123",
          "order_id": "order_test123",
          "amount": 5000
        }
      }
    }
  }'

# Expected response:
# { "status": "received", "event": "payment.captured", "processed": true }
```

### Using Postman

1. Create POST request to: `https://yourdomain.com/api/payment/webhook`
2. Set header: `x-razorpay-signature: [generated signature]`
3. Body (raw JSON):
```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_test123",
        "order_id": "order_test123",
        "amount": 5000
      }
    }
  }
}
```
4. Send and verify response

---

## 📊 Monitoring & Logging

### Log Output Examples

```
✅ Webhook signature verified successfully
💳 Processing payment.captured event
   Order ID: order_12345
   Payment ID: pay_67890
   Amount: ₹500
✅ Order order_12345 marked as PAID
✅ Webhook handled - returning 200 OK to Razorpay
```

### Troubleshooting Logs

| Message | Issue | Solution |
|---------|-------|----------|
| ❌ Invalid webhook signature | Spoofed/tampered | Verify RAZORPAY_WEBHOOK_SECRET |
| ⚠️ Order already PAID | Duplicate webhook | Expected behavior - handled |
| ❌ Failed to update order | DB issue | Check order exists, DB connection |
| 📌 Unknown event type | New Razorpay event | May be safe to ignore |

---

## 🔄 Webhook Retry Logic

**Razorpay automatically retries failed webhooks:**

- 1st attempt: Immediate
- 2nd attempt: After 1 minute
- 3rd attempt: After 5 minutes
- 4th attempt: After 30 minutes
- 5th attempt: After 2 hours
- 6th+ attempts: Every 10 hours up to 72 hours

**Important:** Always return HTTP 200 OK, even on errors! The webhook is idempotent.

```javascript
// ✓ CORRECT - always return 200
res.status(200).json({ status: 'received' });

// ✗ WRONG - causes Razorpay to retry forever
res.status(500).json({ error: 'processing failed' });
```

---

## 🚨 Error Handling

### Signature Verification Failure

```javascript
if (!isValid) {
  logger.error('❌ Invalid webhook signature');
  // Return 401 but webhook will be retried
  return res.status(401).json({ error: 'Invalid signature' });
}
```

### Order Not Found

```javascript
if (!existingOrder) {
  logger.error('Order not found:', razorpayOrderId);
  // Return 200 (not our fault order doesn't exist)
  return res.status(200).json({ status: 'acknowledged' });
}
```

### Database Error

```javascript
try {
  // Update database
} catch (error) {
  logger.error('DB Error:', error);
  // Return 200 so Razorpay retries later
  return res.status(200).json({ status: 'error', error: error.message });
}
```

---

## ✅ Checklist for Production

- [ ] `.env` has all Razorpay variables set
- [ ] `RAZORPAY_WEBHOOK_SECRET` matches Razorpay Dashboard
- [ ] Webhook URL is registered in Razorpay Dashboard
- [ ] Database indexes created on `razorpay_order_id`
- [ ] MySQL connection pool configured
- [ ] express.raw() middleware in place (before express.json())
- [ ] All webhook events tested with test keys
- [ ] Logging enabled for monitoring
- [ ] Error handling returns HTTP 200
- [ ] HTTPS enabled on production
- [ ] Backup/restore procedures for orders table documented

---

## 📞 Support

### Common Issues

**Q: Webhook not triggering?**
- A: Check webhook URL in Razorpay Dashboard
- Check DNS/SSL certificate
- Verify firewall allows Razorpay IPs

**Q: Signature verification failing?**
- A: Ensure raw body is used (not parsed JSON)
- Check `RAZORPAY_WEBHOOK_SECRET` env variable
- Use `express.raw()` middleware

**Q: Orders not updating?**
- A: Check `razorpay_order_id` exists in database
- Verify database connection and indexes
- Check application logs for errors

**Q: Getting duplicate orders?**
- A: Idempotency checks should prevent this
- Check `razorpay_order_id` is unique constraint

---

## 📚 References

- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
- [Razorpay Signature Verification](https://razorpay.com/docs/payments/webhooks/verify-signature/)
- [Node.js Crypto Module](https://nodejs.org/api/crypto.html)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)

