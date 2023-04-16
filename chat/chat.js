const socketIO = require('socket.io')

module.exports = (server) => {
  const io = socketIO(server)

  io.on('connection', (socket) => {
    console.log('User connected')

    socket.on('join', (data) => {
      console.log(`${data.username} user is joined to the room ${data.room}`)
      socket.join(data.room)
    })

    socket.on('message', (data) => {
      console.log(`Receive message: ${data.message}`)

      io.to(data.room).emit('message', data)
    })

    socket.on('disconnect', () => {
      console.log('User disconnected')
    })
  })

  return io
}
