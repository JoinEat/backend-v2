const express = require('express');
const config = require('./config')
const loader = require('./loader')


async function startServer () {
  const app = express();

  await loader({app});

  app.listen(config.port, () => {
    console.log(`Listening on port: ${config.port}`)
  });
}

startServer();
