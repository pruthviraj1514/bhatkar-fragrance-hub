/**
 * PRODUCTION RAZORPAY PAYMENT SCHEMA
 * ===================================
 * Safe schema for ecommerce order and payment tracking
 * Uses InnoDB with proper foreign keys and indices
 */

-- ======================================================================
-- 1. ORDERS TABLE - Track customer orders
-- ======================================================================
-- Purpose: Central order record for each customer transaction
-- Status Flow: PENDING → PAID → SHIPPED → DELIVERED
-- One order = One customer checkout session

CREATE TABLE IF NOT EXISTS orders (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Customer Reference
  user_id INT UNSIGNED NULL,  -- nullable (guest checkout support)
  
  -- Order Basics
  order_number VARCHAR(50) UNIQUE NOT NULL,  -- Raz_12345 format for UI
  total_amount DECIMAL(10, 2) NOT NULL,      -- ₹999.99
  
  -- Razorpay Reference
  razorpay_order_id VARCHAR(255) UNIQUE NOT NULL,  -- order_abc123xyz from Razorpay
  
  -- Status Tracking
  status ENUM('PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED') DEFAULT 'PENDING',
  
  -- Additional Order Data
  items_count INT DEFAULT 0,
  shipping_address TEXT NULL,
  notes TEXT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indices for fast queries
  KEY idx_user_id (user_id),
  KEY idx_razorpay_order_id (razorpay_order_id),
  KEY idx_order_number (order_number),
  KEY idx_status (status),
  KEY idx_created_at (created_at)
);

-- ======================================================================
-- 2. PAYMENTS TABLE - Track payment transactions
-- ======================================================================
-- Purpose: Store payment attempt details from Razorpay
-- One order can have multiple payment attempts (if customer retries)
-- This table is updated by Razorpay webhook

CREATE TABLE IF NOT EXISTS payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Order Reference (Foreign Key)
  order_id INT UNSIGNED NOT NULL,
  
  -- Razorpay References
  razorpay_payment_id VARCHAR(255) UNIQUE NOT NULL,  -- pay_abc123xyz from Razorpay
  razorpay_signature VARCHAR(255) NULL,              -- Signature for webhook verification
  
  -- Payment Status
  payment_status ENUM('PENDING', 'AUTHORIZED', 'SUCCESS', 'FAILED', 'ERROR') DEFAULT 'PENDING',
  
  -- Payment Method
  payment_method VARCHAR(50) NULL,  -- 'card', 'upi', 'wallet', 'netbanking', etc.
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,  -- Amount actually paid
  
  -- Error Tracking
  error_code VARCHAR(100) NULL,     -- Error from Razorpay if failed
  error_message TEXT NULL,          -- Human-readable error message
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key Constraint
  CONSTRAINT fk_payment_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Indices for fast queries
  KEY idx_order_id (order_id),
  KEY idx_razorpay_payment_id (razorpay_payment_id),
  KEY idx_payment_status (payment_status),
  KEY idx_created_at (created_at),
  KEY idx_order_status (order_id, payment_status)
);

-- ======================================================================
-- 3. REFUNDS TABLE - Track refund requests
-- ======================================================================
-- Purpose: Store refund history for audit trail
-- One payment can have multiple refunds

CREATE TABLE IF NOT EXISTS refunds (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- Payment Reference
  payment_id INT UNSIGNED NOT NULL,
  
  -- Razorpay References
  razorpay_refund_id VARCHAR(255) UNIQUE NOT NULL,
  
  -- Refund Details
  refund_amount DECIMAL(10, 2) NOT NULL,
  refund_status ENUM('INITIATED', 'PROCESSED', 'FAILED', 'REVERSED') DEFAULT 'INITIATED',
  
  -- Reason
  refund_reason VARCHAR(255) NULL,  -- 'customer_request', 'order_cancelled', 'damaged_product', etc.
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key
  CONSTRAINT fk_refund_payment FOREIGN KEY (payment_id)
    REFERENCES payments(id) ON DELETE CASCADE,
  
  -- Indices
  KEY idx_payment_id (payment_id),
  KEY idx_razorpay_refund_id (razorpay_refund_id),
  KEY idx_refund_status (refund_status)
);

-- ======================================================================
-- 4. PAYMENT_LOGS TABLE - Audit trail for debugging
-- ======================================================================
-- Purpose: Store all API calls and webhook events for debugging
-- Keep last 90 days of logs (for audits)

CREATE TABLE IF NOT EXISTS payment_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  
  -- References
  order_id INT UNSIGNED NULL,
  payment_id INT UNSIGNED NULL,
  
  -- Log Type
  log_type ENUM('API_CALL', 'WEBHOOK', 'ERROR', 'VERIFICATION') DEFAULT 'API_CALL',
  
  -- Log Details
  action VARCHAR(100) NOT NULL,  -- 'create_order', 'verify_payment', 'webhook_received', etc.
  request_data JSON NULL,
  response_data JSON NULL,
  status_code INT NULL,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign Keys (nullable for non-order/payment logs)
  CONSTRAINT fk_log_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE SET NULL,
  CONSTRAINT fk_log_payment FOREIGN KEY (payment_id)
    REFERENCES payments(id) ON DELETE SET NULL,
  
  -- Indices
  KEY idx_order_id (order_id),
  KEY idx_payment_id (payment_id),
  KEY idx_log_type (log_type),
  KEY idx_action (action),
  KEY idx_created_at (created_at)
);

-- ======================================================================
-- SUMMARY
-- ======================================================================
-- Total Tables: 4
-- 
-- Relationships:
--   orders (1) ←→ (many) payments
--   payments (1) ←→ (many) refunds
--   All tables ← payment_logs (audit trail)
--
-- Key Features:
--   ✅ Foreign key constraints (MySQL enforces data integrity)
--   ✅ Unique indices on Razorpay IDs (prevents duplicates)
--   ✅ Status enums (enforces valid states)
--   ✅ Timestamps for audit trail
--   ✅ JSON storage for flexible API responses
--   ✅ Indices on frequently queried columns
--   ✅ ON DELETE CASCADE for automatic cleanup
-- ======================================================================
