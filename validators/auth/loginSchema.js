const joi = require('joi');

const loginSchema = joi.object({
    phoneNumber: joi.string().regex(/^\d{11}$/).length(11).required(),
})

module.exports = loginSchema;