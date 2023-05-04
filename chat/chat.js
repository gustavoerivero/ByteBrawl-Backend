module.exports = (server) => {
  const io = require('socket.io')(server, {
    cors: {
      origin: 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  })

  // Store all online users inside this map
  global.onlineUsers = new Map()

  io.on('connection', socket => {
    console.log('User connected')

    global.chatSocket = socket

    socket.on('add-user', userID => {
      onlineUsers.set(userID, socket.id)
    })

    socket.on('send-msg', data => {
      const sendUserSocket = onlineUsers.get(data.to)
      if (sendUserSocket) {
        socket.to(sendUserSocket).emit('msg-received', data.text)
      }
    })

  })

  return io
}
