const Joi = require('@hapi/joi');

// Register Validation //
const registerValidation = (data) => {
    const schema = Joi.object({
        name: Joi.string().required().min(6).max(120),
        email: Joi.string().required().min(5).max(60).email(),
        password: Joi.string().required().min(10).max(255)
    });
    return schema.validate(data);
}

// Login Validation //
const loginValidation = (data) => {
    const schema = Joi.object({
        email: Joi.string().required().min(5).max(60).email(),
        password: Joi.string().required().min(10).max(255)
    });
    return schema.validate(data);
}

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;