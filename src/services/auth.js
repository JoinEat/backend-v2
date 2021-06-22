const argon2 = require('argon2');
const User = require('../models/users');
const error = require('../errors');
const jwt = require('jsonwebtoken');
const config = require('../config');

module.exports = {
  signUp,
  login,
};

async function signUp (email, password, name) {
  if (!email || !password || !name) {
    throw error.GENERAL.VALIDATION_ERROR;
  }
  const hashedPassword = await argon2.hash(password);

  let user;
  try {
    user = await User.create({
      email,
      name,
      password: hashedPassword,
    });
  } catch (e) {
    if (e.code == 11000) { // DUPLICATE KEY
      if (e.keyPattern.email == 1) {
        throw error.AUTH.EMAIL_DUPLICATE;
      } else {
        throw error.AUTH.NAME_DUPLICATE;
      }
    }
    throw e;
  }

  delete user.password;
  return user;
}

async function login (emailOrName, password) {
  let user;
  // find user with email first
  user = await User.findOne({email: emailOrName}).select('email name password');
  // if failed try to find with name
  if (!user) await User.findOne({name: emailOrName});

  // if both failed throw error
  if (!user) throw error.AUTH.USER_NOT_EXISTS;

  console.log(user.password, password);
  const passwordMatched = await argon2.verify(user.password, password);
  if (!passwordMatched) throw error.AUTH.PASSWORD_INCORRECT;

  delete user.password;
  return {
    user,
    token: generateToken(user),
  };
}

function generateToken (user) {
  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
  };

  const secret = config.jwt.secret;
  const expiration = '6h';

  return jwt.sign({data}, secret, {expiresIn: expiration});
}
