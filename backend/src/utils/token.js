const jwt = require('jsonwebtoken');
const { JWT_SECRET_KEY } = require('../utils/secrets');
const { logger } = require('./logger');

const generate = (id, email) => jwt.sign({ id, email }, JWT_SECRET_KEY, { expiresIn: '7d' });

const decode = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET_KEY);
    } catch (error) {
        logger.error('Token verification failed:', error.message);
        return { error };
    }
};

module.exports = {
    generate,
    decode
}