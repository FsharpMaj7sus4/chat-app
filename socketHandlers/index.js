const io = require("socket.io")()

let connectedUsers = {}

io.on("connection", socket => {
  const userId = socket.handshake.userId
  if (!connectedUsers[userId]) {
    connectedUsers[userId] = socket.id
  }
  socket.emit("allMyRooms", rooms)
  for (let room of rooms) {
    socket.join(room)
  }

  socket.on("allMsgsBelongingToThisRoom", roomId => {})

  socket.on("newMessage", data => {
    socket.emit("newMessage", data)
  })

  socket.on("disconnect", () => {
    delete connectedUsers[userId]
  })
})

module.exports = io
