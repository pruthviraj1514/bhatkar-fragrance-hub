const db = require('../config/db.config');
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
            const result = await db.query(createNewUserQuery, 
                [
                    newUser.firstname, 
                    newUser.lastname, 
                    newUser.email, 
                    newUser.password
                ]);
            return {
                id: result[0].insertId,
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