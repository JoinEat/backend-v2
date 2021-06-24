const User = require('../models/users');
const error = require('../errors');

const IMMUTABLE_FIELDS = ['name', 'email', 'password', 'verifyStatus', 'friends'];

module.exports = {
  findUsers,
  userIdExist,
  findUserById,
  updateUserById,
  checkUserIdValidAndExist,
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

async function checkUserIdValidAndExist (userId) {
  if (!await userIdExist(userId)) throw error.USER.USER_NOT_FOUND;
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

async function updateUserById (userId, data) {
  for (key in data) {
    if (IMMUTABLE_FIELDS.includes(key)) {
      throw error.USER.FIELD_NOT_MUTABLE;
    }
  }

  await checkUserIdValidAndExist(userId);

  newUser = await User.findOneAndUpdate(
      {_id: userId},
      {$set: data},
      {new: true},
  ).select('-password -friends');
  
  return newUser;
}
