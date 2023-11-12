const io = require("socket.io")()
const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const {
  User,
  Room,
  Sequelize,
  sequelize,
  Message,
} = require("../models")
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

    const roomsData = user.dataValues.Rooms

    socket.on("allMyRooms", async () => {
      let roomIdList = roomsData.map(room => room.id)
      socket.join(roomIdList)

      const lastMessagesIdList = await Message.findAll({
        where: {
          RoomId: {
            [Sequelize.Op.in]: roomIdList,
          },
        },
        attributes: [sequelize.fn("max", sequelize.col("id"))],
        group: ["RoomId"],
        raw: true,
      }).then(uncleanResult => {
        return uncleanResult.map(lastMsgInARoom => lastMsgInARoom.max)
      })
      const lastMessages = await Message.findAll({
        where: {
          id: {
            [Sequelize.Op.in]: lastMessagesIdList,
          },
        },
        raw: true,
      })

      const unreadCountList = await Message.count({
        where: {
          RoomId: {
            [Sequelize.Op.in]: roomIdList,
          },
        },
        group: ["RoomId"],
        attributes: [
          "RoomId",
          [Sequelize.fn("COUNT", "RoomId"), "count"],
        ],
        raw: true,
      })

      const chatList = unreadCountList.map(room => {
        room.lastMessage = lastMessages.find(
          msg => msg.RoomId === room.RoomId
        )
        delete room.lastMessage.RoomId
        return room
      })

      socket.emit("allMyRooms", chatList)
    })

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
