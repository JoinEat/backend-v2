const socketService = require('../services/socket');
const {setUserIdWithToken} = require("../services/socket");

module.exports = async function ({io}) {
  io.on('connection', async (socket) => {
    console.log('User connected');
    // await socketService.socketOnConnect(io, socket);

    socket.on('set_token', (data) => {socketService.setUserIdWithToken(io, socket, data)});

    socket.on('message_join_room', (data) => {socketService.joinRoom(io, socket, data.eventId)});

    socket.on('message_leave_room', (data) => {socketService.leaveRoom(io, socket, data.eventId)});

    socket.on('message_send', (data) => {socketService.messageSent(io, socket, data.eventId)});

    socket.on('connect_error', (err) => {
      console.log(`Connect Error due to ${err.message}`);
    });

    socket.on('disconnect', async function () {
      console.log('User disconnected');
    });
  });

}
