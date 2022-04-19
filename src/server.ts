const express = require('express');
const config = require('./config')
const loader = require('./loader')
const {Server} = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {cors: {origin: '*', methods: ['GET', 'POST']}, allowEIO3: true});

async function startServer () {
  await loader({app, io});

  server.listen(config.port, () => {
    console.log(`Listening on port: ${config.port}`)
  });
}

startServer();

export {};