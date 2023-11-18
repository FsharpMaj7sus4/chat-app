const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const { User, Room } = require("../models")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/AppError")
const io = require('../socketHandlers')

const signToken = id =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  })

const createSendToken = (user, statusCode, res, message) => {
  const cookiesOptions = {
    expires: new Date(
      Date.now() +
      process.env.JWT_COOKIES_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  }

  if (process.env.NODE_ENV === "production")
    cookiesOptions.secure = true

  const token = signToken(user.id)
  res.cookie("jwt", token, cookiesOptions)

  return res.redirect('/')
}

exports.signUp = catchAsync(async (req, res, next) => {
  const { name, phoneNumber } = req.body
  const newUser = await User.create({
    name,
    phoneNumber,
  })
  const globalRoom = await Room.findOne({
    where: {
      id: 1,
    },
  })
  await newUser.addRoom(globalRoom)
  const newUserRaw = await newUser.get({ plain: true })
  io.emit("newUser", newUserRaw)
  io.to(1).emit('newUserInRoom', newUserRaw)

  createSendToken(
    newUser,
    201,
    res,
    "you are signed up successfully!"
  )
})

exports.signupAPI = catchAsync(async (req, res, next) => {
  const { name, phoneNumber } = req.body
  const newUser = await User.create({
    name,
    phoneNumber,
  })
  const globalRoom = await Room.findOne({
    where: {
      id: 1,
    },
  })
  await newUser.addRoom(globalRoom)

  const token = signToken(newUser.id)
  return res.status(200).json({ token })
})

exports.login = catchAsync(async (req, res, next) => {
  // 1) check user and password exist in req.body
  let { phoneNumber } = req.body
  if (!phoneNumber) {
    throw new AppError("please provide your phoneNumber", 400)
  }

  phoneNumber = String(phoneNumber)

  // 2) if user exist && password is correct
  const user = await User.findOne({
    where: {
      phoneNumber,
    },
  })

  if (!user) {
    // throw new AppError('user is not exist with this phoneNumber', 404)
    return res.render("signup", {
      message: "",
      phoneNumber,
    })
  }

  createSendToken(user, 200, res, "you are logged in successfully!")
})

exports.loginAPI = catchAsync(async (req, res, next) => {
  // 1) check if user and password exists in req.body
  let { phoneNumber } = req.body
  if (!phoneNumber) {
    throw new AppError("please provide your phoneNumber", 400)
  }

  phoneNumber = String(phoneNumber)

  // 2) if user exists && password is correct
  const user = await User.findOne({
    where: {
      phoneNumber,
    },
  })

  if (!user) {
    // throw new AppError('no user exists with this phoneNumber', 404)
    return res
      .status(404)
      .json({ message: "no user exists with this phoneNumber" })
  }

  const token = signToken(user.id)
  return res.status(200).json({ token })
})

exports.protect = catchAsync(async (req, res, next) => {
  // point: WE USULLY SEND TOKEN IN HEADER REQUEST (NOT BODY) THIS WAY => authorization: brearer <TOKEN>
  // or send token in cookies
  // 1) check if token exists and it's there
  let token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    // req.headers.authorization.split(' ') => ['brearer', '<TOKEN>']
    token = req.headers.authorization.split(" ")[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  if (!token) {
    // throw new AppError(
    //   "you are not logged in! please log in and try again.",
    //   401
    // )
    res.redirect('/login')
  }

  // 2) verification token
  const decodeToken = await promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  )

  // 3) check if user still exists
  const currentUser = await User.findByPk(decodeToken.id)
  if (!currentUser) {
    throw new AppError(
      "The user belonging to this token does no longer exist!",
      401
    )
  }

  // if compiler reachs at this posit and no error has occured,
  // it means user have token correctly, so let them access current middleware
  req.user = currentUser
  next()
})

exports.restrictTo = function (...roles) {
  // roles => ['admin', 'lead-guide'] , req.user.role => 'user'
  // the main middleware
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new AppError("you are forbidden to access this part", 403)
    }
    next()
  }
}

exports.deleteMe = catchAsync(async (req, res, next) => {
  const user = await User.findOneAndDelete({ _id: req.user._id })
  res.status(204).json({
    status: "success",
    message: "user has been deleted successfully!",
    user,
  })
})

exports.logout = catchAsync(async (req, res, next) => {
  if (req.cookies.jwt) {
    // user is logged in, wants to logged out
    res.status(200).clearCookie("jwt").json({
      status: "success",
      message: "you are logged out successfully!",
    })
  } else {
    // user in NOT logged in already
    res.status(400).json({
      status: "fail",
      message: "you are logged out already!",
    })
  }
})
