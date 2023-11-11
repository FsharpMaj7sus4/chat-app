// module.exports = (err, req, res,next) => {
//     const statusCode = err.statusCode ? err.statusCode : 500;
//     const status = err.status ? err.status : 'error';
//     const message = err.message;

//     console.log({err})

//     if(err.name == 'SequelizeUniqueConstraintError') {
//         err.statusCode = 422,
//         err.status = 'fail',
//         err.message = err.errors[0].message;

//         return res.status(err.statusCode).json({
//             status: err.status,
//             message: err.message,
//             error: err
//         })
//     } else if(err.parent?.code == '22P02') {
//         err.statusCode = 400;
//         err.status = 'fail';

//         return res.status(err.statusCode).json({
//             status: err.status,
//             message: err.message,
//             error: err
//         })
//     } else if (err.name == 'SequelizeValidationError') {
//         err.statusCode = 400,
//         err.status = 'fail',
//         err.message = err.errors[0].message;

//         return res.status(err.statusCode).json({
//             status: err.status,
//             message: err.message,
//             error: err
//         })
//     }

//     return res.status(statusCode).json({
//         status,
//         message,
//         error: err
//     })
// }


/* eslint-disable no-proto */
const AppError = require('../utils/AppError');

const handleJWTError = () =>
  new AppError('The Token is Invalid, please log in again!', 401);

const handleExpiredToken = () =>
  new AppError('The Token is expired, please login again!', 401);

const handleValidationError = (err) => {
    return new AppError(err.message, 400)
}

const handleDublicateError = (err) => {
  return new AppError(err.message, 409)
}

const handleInvalidDataTypeError = (err) => {
  return new AppError(err.message, 400);
}

const sendErrorDev = (err, req, res) => {
  // WE ARE IN API
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    //WE ARE IN RENDERED WEBSITE
    res.status(err.statusCode).render('error', {
      title: 'Error',
      message: err.message,
      error: {
        status: err.status,
        stack: err.stack
      }
    });
  }
  console.log('Error: ', err);
};

const sendErrorProd = (err, req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    // WE ARE IN API
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // this error is related to programming problme, so we are not gonna show
      // all the details to client

      // 1) Log Error to console
      console.error(`Error: ${err}`);

      // 2) send a thin message just to show somthing went wrong(not details)
      res.status(500).json({
        status: 'error',
        message: 'Oops, somthing went wrong!',
      });
    }
  }
  // WE ARE IN RENDERED WEBSITE
  else if (err.isOperational) {
    // we made this error ourself with specific message by AppError
    res.status(err.statusCode).render('error', {
      title: 'Error',
      msg: err.message,
    });
  } else {
    // this error is related to programming problme, so we are not gonna show
    // all the details to client

    // 1) Log Error to console
    console.log('Error:', err);

    // 2) send a thin message just to show somthing went wrong(not details)
    res.status(500).render('error', {
      title: 'Error',
      msg: 'please try again later!',
    });
  }
};

module.exports = (err, req, res, next) => {
  // here is where we're gonna handle all the Error (operational Error)
  err.status = err.status || 'error';
  err.statusCode = err.statusCode || 500;
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    // error.__proto__ = err.__proto__;
    Object.setPrototypeOf(error, Object.getPrototypeOf(err));
    error.message = err.message;
    // meaning of these if else statements is we wanna make error operational by ourself using AppError
    if (err.name == 'SequelizeUniqueConstraintError') handleDublicateError();
    else if (err.parent?.code == '22P02') handleInvalidDataTypeError();
    else if(err.name == 'SequelizeValidationError') handleValidationError(error);
    // when jwt.verify() makes error, thats name is JsonWebTokenError, it's  related to verifying (not match signitures together, manipulated payload in Token)
    else if (err.name === 'JsonWebTokenError') error = handleJWTError();
    // when Token is Expired jwt.verify func throw an Error with name is TokenExpiredError
    else if (err.name === 'TokenExpiredError') error = handleExpiredToken();

    sendErrorProd(error, req, res);
  }
};