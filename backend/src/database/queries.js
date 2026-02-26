// ============================================================================
// USERS QUERIES - MySQL Compatible
// ============================================================================
// Converted back to MySQL from PostgreSQL
// - $1 placeholders → ?
// - AUTO_INCREMENT for primary key
// ============================================================================

const { DB_NAME } = require('../utils/secrets')

const createDB = `CREATE DATABASE ${DB_NAME}`;

const dropDB = `DROP DATABASE IF EXISTS ${DB_NAME}`;

const createTableUSers = `
CREATE TABLE IF NOT EXISTS users (
    id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    firstname VARCHAR(50) NULL,
    lastname VARCHAR(50) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT NOW()
)
`;

const createNewUser = `
INSERT INTO users (firstname, lastname, email, password, created_on)
VALUES (?, ?, ?, ?, NOW())
`;

const findUserByEmail = `
SELECT * FROM users WHERE email = ?
`;

module.exports = {
    createDB,
    dropDB,
    createTableUSers,
    createNewUser,
    findUserByEmail
};
