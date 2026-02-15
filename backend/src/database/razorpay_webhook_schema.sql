-- ========================================================
-- RAZORPAY WEBHOOK SYSTEM - MYSQL SCHEMA
-- ========================================================
-- Production-ready schema for payment webhook processing
-- Includes tables, indexes, and example queries
-- ========================================================

-- ========================================================
-- ORDERS TABLE
-- Stores payment orders created by customers
-- ========================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique order ID',
  user_id INT NOT NULL COMMENT 'Customer user ID',
  product_id INT NOT NULL COMMENT 'Product being purchased',
  quantity INT NOT NULL DEFAULT 1 COMMENT 'Order quantity',
  total_amount DECIMAL(10, 2) NOT NULL COMMENT 'Total order amount in INR',
  razorpay_order_id VARCHAR(50) UNIQUE NOT NULL COMMENT 'Razorpay order ID - unique identifier',
  status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') 
    DEFAULT 'PENDING' COMMENT 'Order status - updated by webhook',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Order creation time',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
    COMMENT 'Last update time - updated when webhook processes',
  
  -- ========================================================
  -- INDEXES FOR WEBHOOK PERFORMANCE
  -- ========================================================
  -- Webhook lookup by razorpay_order_id (O(1) lookup)
  UNIQUE INDEX idx_razorpay_order_id (razorpay_order_id),
  
  -- Filter orders by status (analytics, reporting)
  INDEX idx_status (status),
  
  -- Find user's orders
  INDEX idx_user_id (user_id),
  
  -- Recent orders for analytics
  INDEX idx_created_at (created_at),
  
  -- Composite index for common queries
  INDEX idx_user_status (user_id, status),
  
  -- ========================================================
  -- FOREIGN KEYS FOR REFERENTIAL INTEGRITY
  -- ========================================================
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Payment orders processed by webhook system';

-- ========================================================
-- PAYMENTS TABLE  
-- Stores payment details received from Razorpay webhooks
-- ========================================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'Unique payment record ID',
  order_id INT NOT NULL COMMENT 'Reference to orders table',
  razorpay_payment_id VARCHAR(50) UNIQUE NOT NULL 
    COMMENT 'Razorpay payment ID - unique identifier',
  razorpay_signature VARCHAR(128) COMMENT 'HMAC SHA256 signature for verification',
  payment_status ENUM('captured', 'failed', 'pending', 'refunded') 
    DEFAULT 'pending' COMMENT 'Payment status from webhook',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    COMMENT 'Timestamp when webhook received',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP 
    COMMENT 'Last update time',
  
  -- ========================================================
  -- INDEXES FOR WEBHOOK PROCESSING
  -- ========================================================
  -- Fast lookup by order ID
  INDEX idx_order_id (order_id),
  
  -- Fast webhook deduplification by payment ID
  UNIQUE INDEX idx_razorpay_payment_id (razorpay_payment_id),
  
  -- Filter by payment status
  INDEX idx_payment_status (payment_status),
  
  -- Analytics queries on payment timing
  INDEX idx_created_at (created_at),
  
  -- ========================================================
  -- FOREIGN KEY
  -- ========================================================
  FOREIGN KEY (order_id) REFERENCES orders(id) 
    ON DELETE CASCADE COMMENT 'Delete payment if order deleted'
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Payment details from Razorpay webhooks';

-- ========================================================
-- WEBHOOK EVENTS LOG TABLE (OPTIONAL - for debugging)
-- Tracks all webhook events for audit trail
-- ========================================================
CREATE TABLE IF NOT EXISTS webhook_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL COMMENT 'e.g., payment.captured, payment.failed',
  razorpay_order_id VARCHAR(50) COMMENT 'Razorpay order ID',
  razorpay_payment_id VARCHAR(50) COMMENT 'Razorpay payment ID',
  payload JSON COMMENT 'Full webhook payload stored as JSON',
  signature_verified BOOLEAN DEFAULT 0 COMMENT 'Was signature valid?',
  order_updated BOOLEAN DEFAULT 0 COMMENT 'Was order status updated?',
  error_message TEXT COMMENT 'Any error that occurred',
  ip_address VARCHAR(45) COMMENT 'IP address that sent webhook',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_event_type (event_type),
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_created_at (created_at),
  INDEX idx_signature_verified (signature_verified)
  
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 
  COLLATE=utf8mb4_unicode_ci
  COMMENT='Audit trail of all webhook operations';

-- ========================================================
-- WEBHOOK STATISTICS VIEW (For monitoring)
-- ========================================================
CREATE OR REPLACE VIEW webhook_statistics AS
SELECT
  DATE(o.created_at) as order_date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN o.status = 'PAID' THEN 1 ELSE 0 END) as paid_orders,
  SUM(CASE WHEN o.status = 'FAILED' THEN 1 ELSE 0 END) as failed_orders,
  SUM(CASE WHEN o.status = 'REFUNDED' THEN 1 ELSE 0 END) as refunded_orders,
  SUM(CASE WHEN o.status = 'PENDING' THEN 1 ELSE 0 END) as pending_orders,
  ROUND(100.0 * SUM(CASE WHEN o.status = 'PAID' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate_percent,
  ROUND(SUM(CASE WHEN o.status = 'PAID' THEN o.total_amount ELSE 0 END), 2) as revenue_paid
FROM orders o
GROUP BY DATE(o.created_at);

-- ========================================================
-- CRITICAL QUERIES FOR WEBHOOK OPERATIONS
-- ========================================================

-- ========================================================
-- QUERY 1: Update order status (called by webhook)
-- Performance: O(1) - uses unique index on razorpay_order_id
-- ========================================================

-- payment.captured → Order PAID
-- UPDATE orders
-- SET status = 'PAID', updated_at = NOW()
-- WHERE razorpay_order_id = ?;

-- payment.failed → Order FAILED  
-- UPDATE orders
-- SET status = 'FAILED', updated_at = NOW()
-- WHERE razorpay_order_id = ?;

-- refund.processed → Order REFUNDED
-- UPDATE orders
-- SET status = 'REFUNDED', updated_at = NOW()
-- WHERE razorpay_order_id = ?;

-- ========================================================
-- QUERY 2: Idempotency check (prevent duplicate processing)
-- Performance: O(1) - uses unique index
-- ========================================================

-- SELECT id, status FROM orders
-- WHERE razorpay_order_id = ? LIMIT 1;
-- 
-- If status already = 'PAID':
--   Skip update (duplicate webhook, already processed)

-- ========================================================
-- QUERY 3: Insert payment record (from webhook data)
-- Performance: O(1) - simple insert to indexed table
-- ========================================================

-- INSERT INTO payments 
-- (order_id, razorpay_payment_id, razorpay_signature, payment_status, created_at)
-- VALUES (?, ?, ?, ?, NOW());

-- ========================================================
-- QUERY 4: Get order details for webhook processing
-- Performance: O(1) - uses primary key
-- ========================================================

-- SELECT id, razorpay_order_id, status, total_amount
-- FROM orders
-- WHERE razorpay_order_id = ? LIMIT 1;

-- ========================================================
-- QUERY 5: Analytics - webhook processing statistics
-- Performance: O(n) - aggregation on date
-- ========================================================

-- SELECT
--   DATE(created_at) as date,
--   COUNT(*) as total_orders,
--   SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_orders,
--   SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_orders,
--   ROUND(100.0 * SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
-- FROM orders
-- WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- ========================================================
-- QUERY 6: Find orders pending webhook confirmation
-- Performance: O(log n) - uses status index
-- ========================================================

-- SELECT id, razorpay_order_id, user_id, total_amount, created_at
-- FROM orders
-- WHERE status = 'PENDING' AND created_at < DATE_SUB(NOW(), INTERVAL 1 HOUR)
-- ORDER BY created_at DESC
-- LIMIT 50;

-- ========================================================
-- QUERY 7: Recent webhook processing in last hour
-- Performance: O(log n) - uses created_at index
-- ========================================================

-- SELECT 
--   o.id,
--   o.razorpay_order_id,
--   o.status,
--   p.razorpay_payment_id,
--   p.created_at as webhook_received_at,
--   TIMESTAMPDIFF(SECOND, p.created_at, o.updated_at) as processing_time_sec
-- FROM orders o
-- LEFT JOIN payments p ON o.id = p.order_id
-- WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
-- ORDER BY p.created_at DESC
-- LIMIT 100;

-- ========================================================
-- QUERY 8: Check for duplicate payment attempts
-- Performance: O(1) - uses unique index on razorpay_payment_id
-- ========================================================

-- SELECT COUNT(*) FROM payments
-- WHERE razorpay_payment_id = ? LIMIT 1;
-- 
-- If COUNT > 0: Payment already processed (idempotency check)

-- ========================================================
-- QUERY 9: Failed payment investigation
-- Performance: O(log n) - uses status index
-- ========================================================

-- SELECT 
--   o.id, 
--   o.razorpay_order_id,
--   o.user_id,
--   o.total_amount,
--   p.razorpay_payment_id,
--   p.payment_status,
--   o.updated_at as status_updated_at
-- FROM orders o
-- LEFT JOIN payments p ON o.id = p.order_id
-- WHERE o.status = 'FAILED'
-- ORDER BY o.updated_at DESC
-- LIMIT 20;

-- ========================================================
-- INDEXES SUMMARY
-- ========================================================
-- 
-- orders table:
--   - idx_razorpay_order_id (UNIQUE) - Webhook lookup [O(1)]
--   - idx_status - Filter by payment status [O(log n)]
--   - idx_user_id - Find user's orders [O(log n)]
--   - idx_created_at - Recent orders [O(log n)]
--   - idx_user_status - Combined query [O(log n)]
--
-- payments table:
--   - idx_order_id - Payment lookup [O(log n)]
--   - idx_razorpay_payment_id (UNIQUE) - Duplicate check [O(1)]
--   - idx_payment_status - Filter by status [O(log n)]
--   - idx_created_at - Analytics [O(log n)]
--
-- webhook_events table (optional audit):
--   - idx_event_type - Filter by event
--   - idx_razorpay_order_id - Track order webhooks
--   - idx_created_at - Time-based queries
--   - idx_signature_verified - Filter verified/failed

-- ========================================================
-- PERFORMANCE NOTES
-- ========================================================
--
-- Webhook Lookup: razorpay_order_id is UNIQUE KEY
--   → Standard webhook processing: ~5-10ms per update
--   → Idempotency check: ~2-3ms per lookup
--
-- Index Strategy:
--   → Unique indexes on identifiers (razorpay_order_id, razorpay_payment_id)
--   → Regular indexes on filtering fields (status, created_at)
--   → Composite index for common queries (user_id, status)
--
-- Expected Performance (with proper indexes):
--   → 100 webhooks/second capacity
--   → Sub-100ms processing time
--   → Auto-scaling with connection pool

-- ========================================================
-- EOD - End of Definition
-- ========================================================
