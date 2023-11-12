const io = require("socket.io")()
const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const { User, Room } = require("../models")
const AppError = require("../utils/AppError")

let connectedUsers = {}

io.on("connection", async socket => {
  try {
    const { jwt_token } = socket.handshake.query

    const decodeToken = await promisify(jwt.verify)(
      jwt_token,
      process.env.JWT_SECRET
    )
    const userId = decodeToken.id
    if (!connectedUsers[userId]) {
      connectedUsers[userId] = socket.id
    }

    let user = await User.findOne({
      where: {
        id: userId,
      },
      include: {
        model: Room,
        attributes: ["name", "id"],
        through: {
          attributes: [],
        },
      },
    })
    if (!user) {
      throw new AppError(
        "The user belonging to this token does no longer exist!",
        401
      )
    }

    let rooms = user.dataValues.Rooms
    let roomIds = rooms.map(room => room.id)
    socket.join(roomIds)
    socket.emit("allMyRooms", rooms)

    socket.on("allMsgsBelongingToThisRoom", roomId => {})

    socket.on("newMessage", data => {
      socket.emit("newMessage", data)
    })

    socket.on("disconnect", () => {
      delete connectedUsers[userId]
    })
  } catch (err) {
    console.log(err)
  }
})

module.exports = io
