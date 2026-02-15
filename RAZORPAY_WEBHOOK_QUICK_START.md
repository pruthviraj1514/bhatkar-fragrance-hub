# Razorpay Webhook System - Quick Start Guide

## 🎯 What You Need to Know

Your webhook system automatically updates order status when Razorpay sends payment events:

```
Customer Pays → Razorpay → Webhook → Database Update → Order Status Changed
```

---

## ⚡ 5-Minute Setup

### Step 1: Environment Variables ✅

Your `.env` already has:
```
RAZORPAY_KEY_ID=rzp_test_SG2Tx6WI4tXjVc
RAZORPAY_KEY_SECRET=QM7kZJM8nnHGjFX62N038cLZ
RAZORPAY_WEBHOOK_SECRET=Bhatkar@3110
RAZORPAY_WEBHOOK_URL=https://bhatkar-fragrance-hub-1.onrender.com/api/payment/webhook
```

### Step 2: Register Webhook in Razorpay Dashboard

1. Log in to [**Razorpay Dashboard**](https://dashboard.razorpay.com)

2. Go to **Settings → Webhooks**
   ![Razorpay Dashboard Navigation]

3. Click **Add Webhook**
   ![Add Webhook Button]

4. Fill in webhook details:
   ```
   URL: https://your-domain.com/api/payment/webhook
   ```

5. Select events to listen to:
   - ✓ **payment.captured** (Order → PAID)
   - ✓ **payment.failed** (Order → FAILED)
   - ✓ **refund.processed** (Order → REFUNDED)

6. **Copy the Webhook ID and Secret**
   - Secret goes to `.env` as `RAZORPAY_WEBHOOK_SECRET`

7. Click **Save**

---

## 🧪 Test Your Webhook

### Option A: Test with Razorpay Dashboard

1. In **Settings → Webhooks**, find your webhook
2. Click the **Test** button
3. Select an event (e.g., `payment.captured`)
4. Click **Send Test Webhook**
5. Check your backend logs:
   ```
   ✅ Webhook signature verified successfully
   💳 Processing payment.captured event
   ✅ Order marked as PAID
   ```

### Option B: Test with cURL

```bash
# 1. Set your webhook secret
WEBHOOK_SECRET="Bhatkar@3110"

# 2. Create test payload
PAYLOAD='{
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

# 3. Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | sed 's/.*= //')

# 4. Send webhook
curl -X POST https://your-domain.com/api/payment/webhook \
  -H "x-razorpay-signature: $SIGNATURE" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"

# Expected response:
# {"status":"received","event":"payment.captured","processed":true}
```

### Option C: Test with Postman

1. Create new **POST** request
2. URL: `https://your-domain.com/api/payment/webhook`
3. Headers:
   ```
   Content-Type: application/json
   x-razorpay-signature: [see Step 4 below]
   ```
4. Body (raw JSON):
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
5. To generate signature in Postman:
   - Use **Tests** tab and Node.js crypto
   - Or copy signature from curl test above
6. Send request

---

## 📊 Webhook Events Handled

| Event | Order Status | Database Update |
|-------|------|---|
| `payment.captured` | **PAID** ✅ | `UPDATE orders SET status='PAID'` |
| `payment.failed` | **FAILED** ❌ | `UPDATE orders SET status='FAILED'` |
| `refund.processed` | **REFUNDED** 💰 | `UPDATE orders SET status='REFUNDED'` |

---

## 🔍 Monitor Your Webhook

### Check Webhook Logs

In your backend application logs:

```
📨 ========== WEBHOOK RECEIVED ==========
Timestamp: 2024-02-15T10:30:45.123Z
IP Address: 1.1.1.1
🔐 Verifying webhook signature...
Expected: abc123def456...
Received: abc123def456...
✅ Webhook signature verified successfully
💳 Processing payment.captured event
   Order ID: order_12345
   Payment ID: pay_67890
   Amount: ₹500
✅ Order order_12345 marked as PAID
✅ Webhook handled - returning 200 OK to Razorpay
========================================
```

### Check Database

```sql
-- See webhook processing
SELECT
  o.razorpay_order_id,
  o.status,
  o.updated_at,
  p.razorpay_payment_id,
  p.created_at as webhook_received_at
FROM orders o
LEFT JOIN payments p ON o.id = p.order_id
WHERE o.created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY o.updated_at DESC;
```

---

## 🚨 Troubleshooting

### Problem: Webhook Not Received

**Check:**
1. URL in Razorpay Dashboard matches your webhook URL
2. HTTPS is enabled on your domain
3. Firewall allows Razorpay IPs
4. Backend service is running

**Test:**
```bash
# Test if endpoint is callable
curl https://your-domain.com/api/payment/webhook \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Should return 400 (missing signature, which is expected)
```

### Problem: "Invalid webhook signature"

**Causes:**
- Wrong `RAZORPAY_WEBHOOK_SECRET` in `.env`
- Webhook secret doesn't match Razorpay Dashboard
- Raw body being modified before signature check

**Fix:**
1. Copy webhook secret from Razorpay Dashboard exactly
2. Paste into `.env`:
   ```
   RAZORPAY_WEBHOOK_SECRET=Bhatkar@3110
   ```
3. Restart backend service
4. Retry webhook test



### Problem: Order Not Updating

**Check:**
1. Order exists in database with correct `razorpay_order_id`
2. Database connection is working
3. User has proper permissions

**Verify:**
```sql
-- Check if order exists
SELECT id, razorpay_order_id, status FROM orders
WHERE razorpay_order_id = 'order_xxxxx';

-- Should return 1 row
```

### Problem: Duplicate Orders Created

**Why:** Razorpay retries webhooks if no 200 response
**Check:** Idempotency logic in `paymentWebhookController.js`
**Solution:** Already handled - checks if order already PAID before updating

---

## 📈 Production Checklist

Before going live:

- [ ] Switch to **Live** Razorpay keys (not test keys)
- [ ] Update `.env` with live credentials:
  ```
  RAZORPAY_KEY_ID=rzp_live_xxxxx
  RAZORPAY_KEY_SECRET=xxxxx
  RAZORPAY_WEBHOOK_SECRET=your-live-webhook-secret
  ```
- [ ] Register webhook in **Live** Razorpay Dashboard
- [ ] Test end-to-end with real payment (small amount)
- [ ] Monitor webhook logs for 24 hours
- [ ] Set up alerts for webhook failures
- [ ] Document rollback procedure if needed

---

## 📚 File Reference

| File | Purpose |
|------|---------|
| `backend/src/controllers/paymentWebhookController.js` | Webhook business logic |
| `backend/src/services/paymentService.js` | Service layer with webhook handling |
| `backend/src/routes/paymentRoutes.js` | Webhook API endpoint |
| `backend/src/middlewares/webhookMiddleware.js` | Raw body capture |
| `backend/.env` | Webhook secrets & config |
| [RAZORPAY_WEBHOOK_SYSTEM.md](./RAZORPAY_WEBHOOK_SYSTEM.md) | Detailed documentation |

---

## 🆘 Quick Support

| Issue | Solution |
|-------|----------|
| Webhook URL shows 404 | Check backend is running, URL is correct |
| Signature invalid | Verify `RAZORPAY_WEBHOOK_SECRET` env var |
| Order not updating | Check order exists in DB, DB connection working |
| Getting duplicate webhooks | Expected - handled by idempotency checks |
| Test webhook not working | Check Razorpay Dashboard webhook status |

---

## ✅ How to Verify Everything Works

1. **Create a test order** via `/api/payment/create-order`
2. **Receive webhook** from Razorpay (or send test webhook)
3. **Check database:**
   ```sql
   SELECT status FROM orders WHERE razorpay_order_id = 'xxx' LIMIT 1;
   ```
4. **Status should be PAID** ✅

Done! Your webhook system is working.

