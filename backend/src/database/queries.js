// ============================================================================
// USERS QUERIES - PostgreSQL Compatible
// ============================================================================
// Converted to PostgreSQL from MySQL
// - ? placeholders → $1
// - SERIAL for primary key
// ============================================================================

const { DB_NAME } = require('../utils/secrets')

const createDB = `CREATE DATABASE ${DB_NAME}`;

const dropDB = `DROP DATABASE IF EXISTS ${DB_NAME}`;

const createTableUSers = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    firstname VARCHAR(50) NULL,
    lastname VARCHAR(50) NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_on TIMESTAMP NOT NULL DEFAULT NOW()
)
`;

const createNewUser = `
INSERT INTO users (firstname, lastname, email, password, created_on)
VALUES ($1, $2, $3, $4, NOW()) RETURNING *
`;

const findUserByEmail = `
SELECT * FROM users WHERE email = $1
`;

module.exports = {
    createDB,
    dropDB,
    createTableUSers,
    createNewUser,
    findUserByEmail
};
