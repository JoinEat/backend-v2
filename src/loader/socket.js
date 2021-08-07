
module.exports = async function ({io}) {
  io.on('connection', (socket) => {
    console.log('A new socket connected');

    socket.on('chat message', function (data) {
      console.log(data);
    })
  })
}