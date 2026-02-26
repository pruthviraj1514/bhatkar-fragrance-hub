// ============================================================================
// ORDERS QUERIES - MySQL Compatible
// ============================================================================
// Converted back to MySQL from PostgreSQL
// - $1 placeholders → ?
// - AUTO_INCREMENT for primary key
// ============================================================================

const createTableOrders = `
CREATE TABLE IF NOT EXISTS orders (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(255) NULL,
    customer_email VARCHAR(255) NULL,
    total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_on TIMESTAMP NOT NULL DEFAULT NOW()
)
`;

const getAllOrders = `
SELECT * FROM orders ORDER BY created_on DESC
`;

const getOrderById = `
SELECT * FROM orders WHERE id = ?
`;

const createOrder = `
INSERT INTO orders (customer_name, customer_email, total, status)
VALUES (?, ?, ?, ?)
`;

const updateOrderStatus = `
UPDATE orders SET status = ?, created_on = NOW() WHERE id = ?
`;

module.exports = {
  createTableOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};
