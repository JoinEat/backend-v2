
module.exports = async function ({io}) {
  io.on('connection', (socket) => {
    console.log('A new socket connected');

    socket.on('connect_error', (err) => {
      console.log(`Connect Error due to ${err.message}`);
    });
  })
}