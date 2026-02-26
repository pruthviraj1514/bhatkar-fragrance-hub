const db = require('../config/db');  // Consolidated MySQL Pool
const {
    createProduct: createProductQuery,
    getAllProducts: getAllProductsQuery,
    getProductById: getProductByIdQuery,
    updateProduct: updateProductQuery,
    deleteProduct: deleteProductQuery
} = require('../database/products.queries');
const { logger } = require('../utils/logger');

// Helper function to convert DECIMAL price to number
const convertProduct = (product) => ({
    ...product,
    price: parseFloat(product.price),
    original_price: product.original_price ? parseFloat(product.original_price) : null,
    discount_percentage: parseFloat(product.discount_percentage || 0),
    shipping_cost: parseFloat(product.shipping_cost || 0),
    other_charges: parseFloat(product.other_charges || 0)
});

class Product {
    constructor(name, brand, price, quantity_ml, quantity_unit, category, concentration, description, stock, is_best_seller = false, is_luxury_product = false, is_active = 0, original_price = null, discount_percentage = 0, shipping_cost = 0, other_charges = 0) {
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.original_price = original_price;
        this.discount_percentage = discount_percentage;
        this.shipping_cost = shipping_cost;
        this.other_charges = other_charges;
        this.quantity_ml = quantity_ml;
        this.quantity_unit = quantity_unit;
        this.category = category;
        this.concentration = concentration;
        this.description = description;
        this.stock = stock;
        this.is_best_seller = is_best_seller;
        this.is_luxury_product = is_luxury_product;
        this.is_active = is_active;
    }

    static async create(newProduct) {
        try {
            // MySQL: result.insertId instead of result.rows[0].id
            const [result] = await db.query(createProductQuery,
                [
                    newProduct.name,
                    newProduct.brand,
                    newProduct.price,
                    newProduct.original_price || null,
                    newProduct.discount_percentage || 0,
                    newProduct.shipping_cost || 0,
                    newProduct.other_charges || 0,
                    newProduct.quantity_ml,
                    newProduct.quantity_unit,
                    newProduct.category,
                    newProduct.concentration,
                    newProduct.description,
                    newProduct.stock,
                    newProduct.is_best_seller || false,
                    newProduct.is_luxury_product || false,
                    newProduct.is_active !== undefined ? newProduct.is_active : 0
                ]);

            return {
                id: result.insertId,
                ...newProduct,
                price: parseFloat(newProduct.price)
            };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async getAll() {
        try {
            // MySQL: [rows] instead of result.rows
            const [rows] = await db.query(getAllProductsQuery);
            return rows.map(convertProduct);
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async getById(id) {
        try {
            // MySQL: [rows] instead of result.rows
            const [rows] = await db.query(getProductByIdQuery, [id]);
            if (rows.length) {
                return convertProduct(rows[0]);
            }
            throw { kind: "not_found" };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async update(id, updatedProduct) {
        try {
            // MySQL: result.affectedRows instead of result.rowCount
            const [result] = await db.query(updateProductQuery,
                [
                    updatedProduct.name,
                    updatedProduct.brand,
                    updatedProduct.price,
                    updatedProduct.original_price || null,
                    updatedProduct.discount_percentage || 0,
                    updatedProduct.shipping_cost || 0,
                    updatedProduct.other_charges || 0,
                    updatedProduct.quantity_ml,
                    updatedProduct.quantity_unit,
                    updatedProduct.category,
                    updatedProduct.concentration,
                    updatedProduct.description,
                    updatedProduct.stock,
                    updatedProduct.is_best_seller || false,
                    updatedProduct.is_luxury_product || false,
                    updatedProduct.is_active !== undefined ? updatedProduct.is_active : 0,
                    id
                ]);

            if (result.affectedRows === 0) {
                throw { kind: "not_found" };
            }
            return {
                id,
                ...updatedProduct,
                price: parseFloat(updatedProduct.price)
            };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async delete(id) {
        try {
            // MySQL: result.affectedRows instead of result.rowCount
            const [result] = await db.query(deleteProductQuery, [id]);
            if (result.affectedRows === 0) {
                throw { kind: "not_found" };
            }
            return { message: "Product deleted successfully" };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }
}

module.exports = Product;
