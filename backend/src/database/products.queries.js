const createTableProducts = `
CREATE TABLE IF NOT EXISTS products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    other_charges DECIMAL(10, 2) DEFAULT 0,
    quantity_ml INT DEFAULT 100,
    quantity_unit VARCHAR(10) DEFAULT 'ml',
    category ENUM('Men', 'Women', 'Unisex') NOT NULL,
    concentration ENUM('EDP', 'EDT', 'Parfum') NOT NULL,
    description TEXT,
    stock INT DEFAULT 0,
    is_best_seller BOOLEAN DEFAULT 0,
    is_luxury_product BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 0,
    created_on TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_on TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
)
`;

const createProduct = `
INSERT INTO products (name, brand, price, original_price, discount_percentage, shipping_cost, other_charges, quantity_ml, quantity_unit, category, concentration, description, stock, is_best_seller, is_luxury_product, is_active)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;

const getAllProducts = `
SELECT * FROM products ORDER BY created_on DESC
`;

const getProductById = `
SELECT * FROM products WHERE id = ?
`;

const updateProduct = `
UPDATE products 
SET name = ?, brand = ?, price = ?, original_price = ?, discount_percentage = ?, shipping_cost = ?, other_charges = ?, quantity_ml = ?, quantity_unit = ?, category = ?, concentration = ?, description = ?, stock = ?, is_best_seller = ?, is_luxury_product = ?, is_active = ?
WHERE id = ?
`;

const deleteProduct = `
DELETE FROM products WHERE id = ?
`;

module.exports = {
    createTableProducts,
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct
};
