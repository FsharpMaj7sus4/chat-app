module.exports = function validateBody (schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
  
        console.log({error})

        if (error) {
            return res.status(400).render('login', {
                message: error.message,
            })
        }

        next();
    }
}