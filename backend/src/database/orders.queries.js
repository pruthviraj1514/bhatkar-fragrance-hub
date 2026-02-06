const createTableOrders = `
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    customer_name VARCHAR(255) NULL,
    customer_email VARCHAR(255) NULL,
    total DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    created_on TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
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
UPDATE orders SET status = ? WHERE id = ?
`;

module.exports = {
  createTableOrders,
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus
};
