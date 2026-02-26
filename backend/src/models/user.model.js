const db = require('../config/db');  // Consolidated MySQL Pool
const { createNewUser: createNewUserQuery, findUserByEmail: findUserByEmailQuery } = require('../database/queries');
const { logger } = require('../utils/logger');

class User {
    constructor(firstname, lastname, email, password) {
        this.firstname = firstname;
        this.lastname = lastname;
        this.email = email;
        this.password = password;
    }

    static async create(newUser) {
        try {
            // MySQL: result.insertId instead of result.rows[0].id
            const [result] = await db.query(createNewUserQuery,
                [
                    newUser.firstname,
                    newUser.lastname,
                    newUser.email,
                    newUser.password
                ]);
            return {
                id: result.insertId,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                email: newUser.email
            };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }

    static async findByEmail(email) {
        try {
            // MySQL: [rows] instead of result.rows
            const [rows] = await db.query(findUserByEmailQuery, [email]);
            if (rows.length) {
                return rows[0];
            }
            throw { kind: "not_found" };
        } catch (error) {
            logger.error(error.message);
            throw error;
        }
    }
}

module.exports = User;
