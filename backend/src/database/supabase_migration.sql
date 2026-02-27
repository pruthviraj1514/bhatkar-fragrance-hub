-- ============================================================================
-- POSTGRESQL SCHEMA MIGRATION SCRIPT FOR SUPABASE
-- ============================================================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(50) NULL,
    lastname VARCHAR(50) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Products Table
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
);

-- Product Images Table
CREATE TABLE IF NOT EXISTS product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    alt_text VARCHAR(255),
    image_order INTEGER NOT NULL DEFAULT 0,
    is_thumbnail BOOLEAN DEFAULT FALSE,
    created_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_id ON product_images(product_id);
CREATE INDEX idx_image_order ON product_images(product_id, image_order);


-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER DEFAULT 1 NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL, -- Amount in INR
    razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) CHECK (status IN ('PENDING', 'PAID', 'FAILED')) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_product_id ON orders(product_id);
CREATE INDEX idx_orders_razorpay_order_id ON orders(razorpay_order_id);
CREATE INDEX idx_orders_status ON orders(status);

-- Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
    razorpay_payment_id VARCHAR(100) NOT NULL UNIQUE,
    razorpay_signature VARCHAR(255) NOT NULL,
    payment_status VARCHAR(20) CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')) DEFAULT 'PENDING',
    gateway_response JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_razorpay_payment_id ON payments(razorpay_payment_id);
CREATE INDEX idx_payments_payment_status ON payments(payment_status);

-- Function to perfectly mimic ON UPDATE CURRENT_TIMESTAMP in PG
CREATE OR REPLACE FUNCTION update_timestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_on = NOW();
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_modtime BEFORE UPDATE ON products FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_product_images_modtime BEFORE UPDATE ON product_images FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON orders FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
CREATE TRIGGER update_payments_modtime BEFORE UPDATE ON payments FOR EACH ROW EXECUTE PROCEDURE update_timestamp_column();
