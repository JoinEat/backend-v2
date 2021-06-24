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

  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    clientId: process.env.EMAIL_CLIENT_ID,
    clientSecret: process.env.EMAIL_CLIENT_SECRET,
    refreshToken: process.env.EMAIL_REFRESH_TOKEN,
  },
};

