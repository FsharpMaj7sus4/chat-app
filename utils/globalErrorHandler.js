module.exports = (err, req, res,next) => {
    const statusCode = err.statusCode ? err.statusCode : 500;
    const status = err.status ? err.status : 'error';
    const message = err.message;

    console.log({err})

    if(err.name == 'SequelizeUniqueConstraintError') {
        err.statusCode = 422,
        err.status = 'fail',
        err.message = err.errors[0].message;

        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err
        })
    } else if(err.parent?.code == '22P02') {
        err.statusCode = 400;
        err.status = 'fail';

        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err
        })
    } else if (err.name == 'SequelizeValidationError') {
        err.statusCode = 400,
        err.status = 'fail',
        err.message = err.errors[0].message;

        return res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
            error: err
        })
    }

    return res.status(statusCode).json({
        status,
        message,
        error: err
    })
}