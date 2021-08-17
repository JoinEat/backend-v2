const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = {
    setUserIdWithToken,
    joinRoom,
    leaveRoom,
    notifyMessageUpdate,
    messageSent,
};

async function setUserIdWithToken (io, socket, data) {
    // get user token
    const {token} = data;

    // TODO: handle error
    // get user id from token with jwt
    const userId = jwt.verify(token, config.jwt.secret).data._id;

    // set socket userId
    socket.userId = userId;
}

async function joinRoom (io, socket, eventId) {
    console.log('[SocketIO] join room: ', socket.userId, eventId);
    socket.join(String(eventId));
}

async function leaveRoom (io, socket, eventId) {
    console.log('[SocketIO] leave room: ', socket.userId, eventId);
    socket.leave(String(eventId));
}

async function notifyMessageUpdate (io, eventId) {
    console.log('notify ', eventId, String(eventId));
    io.to(String(eventId)).emit("message_update", {eventId});
}

async function messageSent (io, socket, eventId) {
    notifyMessageUpdate(io, eventId);
}