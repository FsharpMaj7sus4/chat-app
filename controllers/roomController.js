const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const { User, Room } = require("../models")
const catchAsync = require("../utils/catchAsync")
const AppError = require("../utils/AppError")


exports.getAllRooms = catchAsync(async (req, res, next) => {
    const rooms = await Room.findAll();
})

