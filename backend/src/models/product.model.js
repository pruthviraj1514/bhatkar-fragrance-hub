const db = require('../config/db.config');
const { 
    createProduct: createProductQuery,
    getAllProducts: getAllProductsQuery,
    getProductById: getProductByIdQuery,
    updateProduct: updateProductQuery,
    deleteProduct: deleteProductQuery
} = require('../database/products.queries');
const { logger } = require('../utils/logger');

class Product {
    constructor(name, brand, price, category, concentration, description, stock) {
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.category = category;
        this.concentration = concentration;
        this.description = description;
        this.stock = stock;
    }

    static async create(newProduct) {
        try {
            const result = await db.query(createProductQuery, 
                [
                    newProduct.name,
                    newProduct.brand,
                    newProduct.price,
                    newProduct.category,
                    newProduct.concentration,
                    newProduct.description,
                    newProduct.stock
                ]);
            return {
                id: result[0].insertId,
                ...newProduct
            };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async getAll() {
        try {
            const [rows] = await db.query(getAllProductsQuery);
            return rows;
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async getById(id) {
        try {
            const [rows] = await db.query(getProductByIdQuery, [id]);
            if (rows.length) {
                return rows[0];
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
                    updatedProduct.category,
                    updatedProduct.concentration,
                    updatedProduct.description,
                    updatedProduct.stock,
                    id
                ]);
            if (result[0].affectedRows === 0) {
                throw { kind: "not_found" };
            }
            return { id, ...updatedProduct };
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
                return;
            }
            if (res.affectedRows === 0) {
                cb({ kind: "not_found" }, null);
            return { message: "Product deleted successfully" };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }
}

module.exports = Product;
