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

const whoIs = async (socket) => {
  const { jwt_token } = socket.handshake.query
  let decodeToken
  try {
    decodeToken = await promisify(jwt.verify)(
      jwt_token,
      process.env.JWT_SECRET
    )
  } catch (err) {
    console.log(err)
    return socket.emit('logout')
  }

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
      }
    },
  })
  if (!user) {
    console.log(`userId in JWT token was not valid!! userId: ${userId}`)
    return socket.emit('logout')
  }

  return user
}

io.on("connection", async socket => {
  try {
    const user = await whoIs(socket)
    const roomsData = user.dataValues.Rooms.map(room => room.get({ plain: true }))

    socket.on("allMyRooms", async () => {
      let roomIdList = roomsData.map(room => room.id)

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

      const chatList = roomsData.map(room => {
        room.lastMessage = lastMessages.find(
          msg => msg.RoomId === room.RoomId
        ) || {}
        return room
      })

      socket.emit("allMyRooms", chatList)
    })

    socket.on("roomMessages", async roomId => {
      const messages = await Message.findAll({
        where: { RoomId: roomId },
        order: [['createdAt', 'DESC']],
        raw: true,
        include: {
          model: User,
          as: 'senderId',
          attributes: ['name', 'id']
        }
      })

      socket.emit('roomMessages', messages)
    })

    socket.on("newTextMessage", async data => {
      const { roomId, text, repliedTo } = data
      const messageInfo = Object.assign(
        {},
        { text },
        { RoomId: roomId },
        { senderId: user.id },
        repliedTo ? { repliedTo } : null
      )
      const newMessage = await Message.create(messageInfo).then(message => message.get({ plain: true }))

      io.sockets.in(roomId).emit("newTextMessage", newMessage)
    })

    socket.on("disconnect", () => {
      delete connectedUsers[user.id]
    })
  } catch (err) {
    console.log(err)
  }
})

module.exports = io
