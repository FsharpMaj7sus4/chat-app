const io = require("socket.io")()
const { promisify } = require("util")
const jwt = require("jsonwebtoken")
const fs = require("fs")
const { Sequelize, sequelize, User, Room, Message, File } = require("../models")
const AppError = require("../utils/AppError")

let connectedUsers = {}

const whoIs = async socket => {
  const { jwt_token } = socket.handshake.query
  let decodeToken
  try {
    decodeToken = await promisify(jwt.verify)(jwt_token, process.env.JWT_SECRET)
  } catch (err) {
    console.log(err)
    return socket.emit("logout")
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
      attributes: ["name", "id", "createdAt"],
      through: {
        attributes: [],
      },
    },
  })

  if (!user) {
    return socket.emit("logout")
  }

  return user
}

const makeChatListAndJoin = async (socket, roomsData, userId) => {
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
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["name"],
        nested: true,
      },
    ],
  })

  const unreadCountList = await Message.count({
    where: {
      RoomId: {
        [Sequelize.Op.in]: roomIdList,
      },
      isSeen: false,
      senderId: {
        [Sequelize.Op.not]: userId,
      },
    },
    group: ["RoomId"],
    attributes: ["RoomId", [Sequelize.fn("COUNT", "RoomId"), "count"]],
    raw: true,
  })

  let chatList = roomsData.map(room => {
    room.lastMessage = lastMessages.find(msg => msg.RoomId === room.id)
    const unreadCount = unreadCountList.find(msgCount => msgCount.RoomId === room.id)
    room.messageCount = unreadCount ? unreadCount.count : 0
    return room
  })

  chatList.sort((a, b) => {
    const aLastUpdate = a.lastMessage ? a.lastMessage.createdAt : a.createdAt
    const bLastUpdate = b.lastMessage ? b.lastMessage.createdAt : b.createdAt
    return Date.parse(bLastUpdate) - Date.parse(aLastUpdate)
  })

  return chatList
}

const getRepliedMessage = async repliedToId => {
  let repliedTo = await Message.findByPk(repliedToId, {
    include: [
      {
        model: User,
        as: "sender",
        attributes: ["name"],
      },
      {
        model: File,
        attributes: ["originalName", "fileName", "size", "mimeType"],
      },
    ],
    attributes: ["text"],
  })
  return repliedTo
}

io.on("connection", async socket => {
  try {
    const user = await whoIs(socket)
    const roomsData = user.dataValues.Rooms.map(room => room.get({ plain: true }))
    // socket.on('allMyRooms', async () => {
    const chatList = await makeChatListAndJoin(socket, roomsData, user.id)
    const allUsers = await User.findAll({ raw: true })
    socket.emit("allUsers&MyRooms", {
      rooms: chatList,
      users: allUsers,
      connectedUsers: Object.keys(connectedUsers),
    })
    io.emit("userOnline", user.id)
    // })

    socket.on("roomData", async roomId => {
      let room = await Room.findOne({
        where: { id: roomId },
        include: [
          {
            model: User,
            through: {
              attributes: [],
            },
            raw: true,
          },
          {
            model: Message,
            include: [
              {
                model: User,
                as: "sender",
                attributes: ["name"],
              },
              {
                model: Message,
                as: "repliedTo",
                attributes: ["text"],
                include: [
                  {
                    model: User,
                    as: "sender",
                    attributes: ["name"],
                  },
                  {
                    model: File,
                    attributes: ["originalName", "fileName", "size", "mimeType"],
                  },
                ],
                raw: true,
              },
              {
                model: File,
                attributes: ["originalName", "fileName", "size", "mimeType"],
              },
            ],
            raw: true,
          },
        ],
        order: [[{ model: Message }, "id", "DESC"]],
      })
      room = await room.get({ plain: true })
      // room.Messages = room.Messages.slice(0, 10)
      socket.emit("roomData", room)
    })

    socket.on("newTextMessage", async data => {
      const { roomId, text, repliedToId } = data
      const messageInfo = Object.assign(
        {},
        { text },
        { RoomId: roomId },
        { senderId: user.id },
        repliedToId ? { repliedToId } : null
      )
      let newMessage = await Message.create(messageInfo).then(message => message.get({ plain: true }))
      if (repliedToId) {
        newMessage.repliedTo = await getRepliedMessage(repliedToId)
      }
      newMessage.sender = { name: user.name }

      io.to(Number(roomId)).emit("newTextMessage", newMessage)
    })

    socket.on("newFileMessage", async data => {
      const { roomId, text, fileInfo } = data
      const file = await File.create(fileInfo).then(file => file.get({ plain: true }))
      const messageInfo = Object.assign({}, text ? { text } : null, { RoomId: roomId }, { senderId: user.id }, { FileId: file.id })
      let newMessage = await Message.create(messageInfo).then(message => message.get({ plain: true }))
      // newMessage = await newMessage.get({ plain: true })
      newMessage.sender = { name: user.name }
      newMessage.File = file
      io.to(Number(roomId)).emit("newFileMessage", newMessage)
    })

    socket.on("editMessage", async data => {
      const result = await Message.update(
        { text: data.text },
        {
          where: { id: data.id },
          returning: true,
          plain: true,
        }
      )
      const message = result[1].dataValues
      io.to(message.RoomId).emit("editMessage", message)
    })

    socket.on("deleteMessage", async data => {
      const { messageId, roomId } = data
      const deletedMessage = await Message.destroy({ where: { id: messageId } })
      if (deletedMessage === 1) {
        io.to(roomId).emit(`deleteMessage`, { messageId, roomId })
      }
    })

    socket.on("deleteFile", async fileName => {
      fs.unlinkSync(`${__dirname}/public/uploads/${fileName}`)
    })

    socket.on("seen", async roomId => {
      await Message.update({ isSeen: true }, { where: { RoomId: roomId, senderId: { [Sequelize.Op.not]: user.id } } })
      socket.to(roomId).emit("seen", roomId)
    })

    socket.on("newPvRoom", async otherUserId => {
      const otherUser = await User.findByPk(otherUserId)
      const roomName = user.id > otherUserId ? `${user.id}|#|${otherUserId}` : `${otherUserId}|#|${user.id}`
      const [room, created] = await Room.findOrCreate({ where: { name: roomName } })
      if (created) {
        await room.setUsers([user, otherUser])

        if (connectedUsers[otherUserId]) {
          io.sockets.connected[connectedUsers[otherUserId]].join(room.id)
          io.to(connectedUsers[otherUserId]).emit("addedToNewRoom", room)
        }
        socket.join(room.id)
        socket.emit("createdNewRoom", { room, isNew: true })
      } else {
        socket.emit("createdNewRoom", { room, isNew: false })
      }
    })

    socket.on("newGpRoom", async roomData => {
      const { name, userIds } = roomData
      const newRoom = await Room.create({ name })
      let users = await User.findAll({
        where: {
          id: {
            [Sequelize.Op.in]: userIds,
          },
        },
      })
      users.push(user)
      await newRoom.setUsers(users)

      for (let userId of userIds) {
        if (connectedUsers[userId]) {
          io.sockets.sockets.get(connectedUsers[userId]).join(newRoom.id)
          io.to(connectedUsers[userId]).emit("addedToNewRoom", newRoom)
        }
      }
      socket.join(newRoom.id)
      socket.emit("createdNewRoom", { room: newRoom, isNew: true })
    })

    socket.on("addUsersToRoom", async data => {
      const { newMemberIds, roomId } = data
      const room = await Room.findByPk(roomId)
      let users = await User.findAll({
        where: {
          id: {
            [Sequelize.Op.in]: newMemberIds,
          },
        },
      })
      await room.addUsers(users)

      for (let userId of newMemberIds) {
        if (connectedUsers[userId]) {
          io.sockets.sockets.get(connectedUsers[userId]).join(roomId)
          io.to(connectedUsers[userId]).emit("addedToNewRoom", room)
        }
      }
      users = await users.map(user => {
        const plainUser = user.get({ plain: true })
        return plainUser
      })
      io.to(roomId).emit("newUsersInRoom", { roomId, users })
    })

    socket.on("disconnect", () => {
      io.emit("userOffline", user.id)
      delete connectedUsers[user.id]
    })
  } catch (err) {
    console.log(err)
  }
})

module.exports = io
