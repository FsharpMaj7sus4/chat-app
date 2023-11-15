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
    return await socket.emit('logout')
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
    return await socket.emit('logout')
  }

  return user
}

io.on("connection", async socket => {
  try {
    const user = await whoIs(socket)
    const roomsData = user.dataValues.Rooms.map(room => room.get({ plain: true }))

    socket.on("allMyRooms", async () => {
      let roomIdList = roomsData.map(room => room.id)
      await socket.join(roomIdList)

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
        include: [{
          model: User,
          attributes: ['name'],
          nested: true
        }]
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
        room.lastMessage = lastMessages.find(msg => msg.RoomId === room.id)
        const unreadCount = unreadCountList.find(
          msgCount => msgCount.RoomId === room.id
        )
        room.messageCount = unreadCount.count
        return room
      })

      await socket.emit("allMyRooms", chatList)
    })

    socket.on("roomData", async roomId => {
      const room = await Room.findOne({
        where: { id: roomId },
        include: [
          {
            model: User,
            through: {
              attributes: [],
            },
            attributes: ['id', 'name']
          },
          {
            model: Message,
            order: [['createdAt', 'DESC']],
            include: {
              model: User,
              attributes: ['name']
            }
          }
        ]
      })

      await socket.emit('roomData', room)
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
      const newMessage = await Message
        .create(messageInfo, {
          include: [
            {
              model: User,
              through: {
                attributes: [],
              },
              attributes: ['id', 'name']
            }]
        })
        .then(message => message.get({ plain: true }))
      await io.to(Number(roomId)).emit("newTextMessage", newMessage)
    })

    socket.on("disconnect", () => {
      delete connectedUsers[user.id]
    })
  } catch (err) {
    console.log(err)
  }
})

module.exports = io
