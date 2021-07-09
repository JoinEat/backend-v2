const User = require('../models/users');
const error = require('../errors');

const IMMUTABLE_FIELDS = ['name', 'email', 'password', 'verifyStatus', 'friends'];
const SEARCH_FIELDS = ['email', 'name', 'realName', 'nickName', 'school', 'gender', 'department'];
const publicFields = ['email', 'name', '_id', 'nickName'];

module.exports = {
  findUsers,
  userIdExist,
  findUserById,
  updateUserById,
  checkUserIdValidAndExist,
  SEARCH_FIELDS,
}

async function isFriendOf (userId, targetId) {
  if (!userId || !targetId) return false;
  const cur = await User.findById(userId, {
    friends: {$elemMatch: {friendId: targetId}},
  });
  return (cur.friends.length && cur.friends[0].state == 'success');
}

async function findUsers (filter, excludeFriendOfUser, nickNameSubstr, limit, nextKey) {
  for (key in filter) {
    if (!SEARCH_FIELDS.includes(key)) throw error.USER.FIELD_NOT_SEARCHABLE;
  }
  if (excludeFriendOfUser) {
    filter['friends.friendId'] = {$ne: excludeFriendOfUser};
  }
  if (nickNameSubstr) {
    filter['nickName'] = {$regex: nickNameSubstr};
  }

  // pagnination
  if (!limit || limit > 100) limit = 100;
  if (nextKey) {
    filter['_id'] = {$gt: nextKey};
  }

  return User.find(filter).limit(limit).select('email name nickName');
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

async function findUserById (userId, targetId, permission) {
  await checkUserIdValidAndExist(targetId);
  let user = await User.findById(targetId).select('-password');
  user = user.toObject();

  if (!permission && isFriendOf(userId, targetId) && !user.public) {
    user = Object.keys(user)
      .filter(key => publicFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = user[key];
        return obj;
      }, {});
  }
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
