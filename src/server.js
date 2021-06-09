const express = require('express');
const config = require('./config')
const bodyParser = require('body-parser');
const cors = require('cors');
const pino = require('pino-http')({level: config.log.level});

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({extended: true}));

app.use(pino);

app.use((err, req, res, next) => {
  req.log.error(err);
  delete err.stack;
  return res.status(err.statusCode || 500).json(err);
});

process.on('unhandledRejection', (reason, p) => {
  throw reason;
});

process.on('uncaughtException', (error) => {
  console.log(error);
  process.exit(1);
});

app.listen(config.port, () => {
  console.log(`Listening on port: ${config.port}`)
});

module.exports = app;
