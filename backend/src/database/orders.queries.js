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
SELECT * FROM orders WHERE id = $1
`;

const createOrder = `
INSERT INTO orders (customer_name, customer_email, total, status)
VALUES ($1, $2, $3, $4) RETURNING *
`;

const updateOrderStatus = `
UPDATE orders SET status = $1, created_on = NOW() WHERE id = $2 RETURNING *
`;

module.exports = {
  createTableOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};
