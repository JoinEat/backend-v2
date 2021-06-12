const express = require('express');
const config = require('../config');
const bodyParser = require('body-parser')
const cors = require('cors');
const pino = require('pino-http')({level: config.log.level});
const routes = require('../routes');
const error = require('../errors');

module.exports = async function ({app}) {
  app.use(cors());

  app.use(bodyParser.json());

  app.use(bodyParser.urlencoded({extended: true}));

  app.use(pino);

  app.use(config.api.prefix, routes());

  app.use((err, req, res, next) => {
    req.log.error(err);

    // programmer error
    if (!err.statusCode) err = error.GENERAL.INTERAL_ERROR;

    return res.status(err.statusCode).json(err);
  });

  process.on('unhandledRejection', (reason, p) => {
    throw reason;
  });

  process.on('uncaughtException', (error) => {
    console.log('error uncaucht', error);
    process.exit(1);
  });
}

