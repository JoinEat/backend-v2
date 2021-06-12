const User = require('../models/users');

module.exports = {
  findUsers,
  userIdExist,
}

async function findUsers () {
  return User.find().select('-password');
}

async function userIdExist (userId) {
  let user;
  user = User.findById(userId);
  return !!user;
}
