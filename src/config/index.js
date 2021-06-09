const dotenv = require('dotenv');

const envFound = dotenv.config();

if (envFound.error) {
  throw envFound.error;
}

module.exports = {
  port: parseInt(process.env.PORT, 10),

  log: {
    level: process.env.LOG_LEVEL,
  }
}

