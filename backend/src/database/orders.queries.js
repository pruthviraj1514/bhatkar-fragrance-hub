// ============================================================================
// ORDERS QUERIES - PostgreSQL Compatible
// ============================================================================
// Converted to PostgreSQL from MySQL
// - ? placeholders → $1, $2, etc.
// - SERIAL for primary key
// ============================================================================

const createTableOrders = `
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    product_id INTEGER,
    quantity INTEGER DEFAULT 1,
    total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    razorpay_order_id VARCHAR(255),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
)
`;

const getAllOrders = `
SELECT 
    o.*, 
    u.email as customer_email, 
    CONCAT(u.firstname, ' ', u.lastname) as customer_name,
    p.name as product_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN products p ON o.product_id = p.id
ORDER BY o.created_at DESC
`;

const getOrderById = `
SELECT 
    o.*, 
    u.email as customer_email, 
    CONCAT(u.firstname, ' ', u.lastname) as customer_name,
    p.name as product_name
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN products p ON o.product_id = p.id
WHERE o.id = $1
`;

const createOrder = `
INSERT INTO orders (user_id, product_id, quantity, total_amount, razorpay_order_id, status)
VALUES ($1, $2, $3, $4, $5, $6) RETURNING *
`;

const updateOrderStatus = `
UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *
`;

const getOrderByRazorpayId = `
SELECT * FROM orders WHERE razorpay_order_id = $1
`;

module.exports = {
  createTableOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  getOrderByRazorpayId
};
