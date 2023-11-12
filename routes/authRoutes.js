const express = require("express")
const {
  signUp,
  login,
  loginAPI,
  signupAPI,
} = require("../controllers/authController")

const authRouter = express.Router()

authRouter.route("/signup").post(signUp)
authRouter.route("/login").post(login)
authRouter.route("/api/v1/signup").post(signupAPI)
authRouter.route("/api/v1/login").post(loginAPI)

module.exports = authRouter
