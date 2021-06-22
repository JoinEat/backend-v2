const User = require('../models/users');
const error = require('../errors');

module.exports = {
  findUsers,
  userIdExist,
  findUserById,
}

async function findUsers () {
  return User.find().select('-password');
}

async function userIdExist (userId) {
  let user;
  try {
    user = await User.findById(userId);
  } catch (e) {
    if (e.name == 'CastError') throw error.USER.USERID_NOT_VALID;
    throw e;
  }
  return !!user;
}

async function findUserById (userId) {
  let user;
  try {
    user = await User.findById(userId).select('-password');
  } catch(e) {
    if (e.name == 'CastError') throw error.USER.USERID_NOT_VALID;
    throw e;
  }
  if (!user) throw error.USER.USER_NOT_FOUND;
  return user;
}
