module.exports = (server) => {
  const { Server } = require('socket.io')

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }
  })

  // Store all online users inside this map
  const onlineUsers = new Map()

  io.on('connection', socket => {

    console.log('User connected')

    socket.on('add-user', userID => {
      if (!onlineUsers.has(userID)) {
        onlineUsers.set(userID, socket.id)
        socket.userID = userID
      }
    })

    socket.on('check-connection', data => {
      const userOnline = onlineUsers.get(data.to)
      const response = { userOnline, id: data.to }
      console.log('Is user online?', response)
      io.to(userOnline).emit('checked', response)
    })

    socket.on('send-msg', data => {
      const sendUserSocket = onlineUsers.get(data.to)
      if (sendUserSocket) {
        io.to(sendUserSocket).emit('msg-received', data.message)
      } else {
        socket.emit('msg-error', { error: `User ${data.to} is not online.` })
      }
    })

    socket.on('disconnect', () => {
      if (socket.userID) {
        onlineUsers.delete(socket.userID)
        console.log(`User ${socket.userID} disconnected`)
      }
    })

  })

  return io
}
