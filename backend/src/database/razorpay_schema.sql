/**
 * Razorpay Payment Database Schema
 * ================================
 * SQL schema for orders and payments tables
 * Run these queries in your MySQL database
 */

-- Drop existing tables (optional - for fresh setup)
-- DROP TABLE IF EXISTS payments;
-- DROP TABLE IF EXISTS orders;

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  product_id INT NULL COMMENT 'Nullable - individual items stored in order_items table',
  quantity INT DEFAULT NULL COMMENT 'Nullable - individual items stored in order_items table',
  total_amount DECIMAL(10, 2) NOT NULL COMMENT 'Amount in INR',
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  status ENUM('PENDING', 'PAID', 'FAILED') DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_user_id (user_id),
  INDEX idx_product_id (product_id),
  INDEX idx_razorpay_order_id (razorpay_order_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at),
  
  -- Foreign keys (optional)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- ORDER_ITEMS TABLE (for multi-item orders)
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL COMMENT 'Price per unit at time of order',
  subtotal DECIMAL(10, 2) NOT NULL COMMENT 'quantity * price',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_order_id (order_id),
  INDEX idx_product_id (product_id),
  
  -- Foreign keys
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_signature VARCHAR(255) NOT NULL,
  payment_status ENUM('PENDING', 'SUCCESS', 'FAILED') DEFAULT 'PENDING',
  gateway_response JSON COMMENT 'Razorpay API response',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for performance
  INDEX idx_order_id (order_id),
  INDEX idx_razorpay_payment_id (razorpay_payment_id),
  INDEX idx_payment_status (payment_status),
  INDEX idx_created_at (created_at),
  
  -- Foreign key
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- HELPFUL QUERIES
-- ============================================

-- Get all paid orders
-- SELECT o.*, p.razorpay_payment_id FROM orders o
-- LEFT JOIN payments p ON o.id = p.order_id
-- WHERE o.status = 'PAID'
-- ORDER BY o.created_at DESC;

-- Get revenue statistics
-- SELECT 
--   DATE(created_at) as date,
--   COUNT(*) as total_orders,
--   SUM(total_amount) as revenue,
--   AVG(total_amount) as avg_order_value
-- FROM orders
-- WHERE status = 'PAID'
-- GROUP BY DATE(created_at)
-- ORDER BY date DESC;

-- Get pending payments
-- SELECT * FROM orders
-- WHERE status = 'PENDING'
-- AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR);
