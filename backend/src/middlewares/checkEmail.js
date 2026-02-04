const User = require('../models/user.model');

const checkEmail = async (req, res, next) => {
    try {
        const { email } = req.body;
        const data = await User.findByEmail(email);
        if (data) {
            return res.status(400).send({
                status: 'error',
                message: `A user with email address '${email}' already exists`
            });
        }
        next();
    } catch (err) {
        // Email not found is expected, continue
        if (err.kind === 'not_found') {
            next();
        } else {
            res.status(500).send({
                status: 'error',
                message: err.message
            });
        }
    }
}

module.exports = checkEmail;