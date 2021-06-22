const dotenv = require('dotenv');

const envFound = dotenv.config();

if (envFound.error) {
  console.log(".env file is missing, using only ENV variables");
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'secret';
}

module.exports = {
  port: parseInt(process.env.PORT, 10),

  log: {
    level: process.env.LOG_LEVEL,
  },

  db: {
    url: process.env.DB_URL,
  },

  api: {
    prefix: process.env.API_PREFIX,
  },
  
  jwt: {
    secret: process.env.JWT_SECRET,
  },
};

