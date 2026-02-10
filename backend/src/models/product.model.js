const db = require('../config/db.config');
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
    price: parseFloat(product.price)
});

class Product {
    constructor(name, brand, price, quantity_ml, quantity_unit, category, concentration, description, stock, is_best_seller = false, is_active = 0) {
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.quantity_ml = quantity_ml;
        this.quantity_unit = quantity_unit;
        this.category = category;
        this.concentration = concentration;
        this.description = description;
        this.stock = stock;
        this.is_best_seller = is_best_seller;
        this.is_active = is_active;
    }

    static async create(newProduct) {
        try {
            const result = await db.query(createProductQuery, 
                [
                    newProduct.name,
                    newProduct.brand,
                    newProduct.price,
                    newProduct.quantity_ml,
                    newProduct.quantity_unit,
                    newProduct.category,
                    newProduct.concentration,
                    newProduct.description,
                    newProduct.stock,
                    newProduct.is_best_seller || false,
                    newProduct.is_active !== undefined ? newProduct.is_active : 0
                ]);
            return {
                id: result[0].insertId,
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
            const [rows] = await db.query(getAllProductsQuery);
            return rows.map(convertProduct);
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async getById(id) {
        try {
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
            const result = await db.query(updateProductQuery,
                [
                    updatedProduct.name,
                    updatedProduct.brand,
                    updatedProduct.price,
                    updatedProduct.quantity_ml,
                    updatedProduct.quantity_unit,
                    updatedProduct.category,
                    updatedProduct.concentration,
                    updatedProduct.description,
                    updatedProduct.stock,
                    updatedProduct.is_best_seller || false,
                    updatedProduct.is_active !== undefined ? updatedProduct.is_active : 0,
                    id
                ]);
            if (result[0].affectedRows === 0) {
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
            const result = await db.query(deleteProductQuery, [id]);
            if (result[0].affectedRows === 0) {
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
