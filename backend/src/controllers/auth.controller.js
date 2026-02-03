const User = require('../models/user.model');
const { hash: hashPassword, compare: comparePassword } = require('../utils/password');
const { generate: generateToken } = require('../utils/token');

exports.signup = async (req, res) => {
    try {
        const { firstname, lastname, email, password } = req.body;
        const hashedPassword = hashPassword(password.trim());

        const user = new User(firstname.trim(), lastname.trim(), email.trim(), hashedPassword);

        const data = await User.create(user);
        const token = generateToken(data.id);
        res.status(201).send({
            status: "success",
            data: {
                token,
                data
            }
        });
    } catch (err) {
        res.status(500).send({
            status: "error",
            message: err.message
        });
    }
};

exports.signin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const data = await User.findByEmail(email.trim());
        
        if (comparePassword(password.trim(), data.password)) {
            const token = generateToken(data.id);
            res.status(200).send({
                status: 'success',
                data: {
                    token,
                    firstname: data.firstname,
                    lastname: data.lastname,
                    email: data.email
                }
            });
            return;
        }
        res.status(401).send({
            status: 'error',
            message: 'Incorrect password'
        });
    } catch (err) {
        if (err.kind === "not_found") {
            res.status(404).send({
                status: 'error',
                message: `User with email ${req.body.email} was not found`
            });
            return;
        }
        res.status(500).send({
            status: 'error',
            message: err.message
        });
    }
}