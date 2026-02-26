// ============================================================================
// PRODUCTS QUERIES - MySQL Compatible
// ============================================================================
// Converted back to MySQL from PostgreSQL
// - $1 placeholders → ?
// - Using LAST_INSERT_ID() or implicit result.insertId
// ============================================================================

const createTableProducts = `
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2),
    discount_percentage DECIMAL(5, 2) DEFAULT 0,
    shipping_cost DECIMAL(10, 2) DEFAULT 0,
    other_charges DECIMAL(10, 2) DEFAULT 0,
    quantity_ml INTEGER DEFAULT 100,
    quantity_unit VARCHAR(10) DEFAULT 'ml',
    category VARCHAR(20) NOT NULL CHECK (category IN ('Men', 'Women', 'Unisex')),
    concentration VARCHAR(20) NOT NULL CHECK (concentration IN ('EDP', 'EDT', 'Parfum')),
    description TEXT,
    stock INTEGER DEFAULT 0,
    is_best_seller BOOLEAN DEFAULT FALSE,
    is_luxury_product BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_on TIMESTAMP NOT NULL DEFAULT NOW()
)
`;

const createProduct = `
INSERT INTO products (
    name, brand, price, original_price, discount_percentage, 
    shipping_cost, other_charges, quantity_ml, quantity_unit, 
    category, concentration, description, stock, 
    is_best_seller, is_luxury_product, is_active
)
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
SET name = ?, brand = ?, price = ?, original_price = ?, 
    discount_percentage = ?, shipping_cost = ?, other_charges = ?,
    quantity_ml = ?, quantity_unit = ?, category = ?, 
    concentration = ?, description = ?, stock = ?, 
    is_best_seller = ?, is_luxury_product = ?, is_active = ?,
    updated_on = NOW()
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
