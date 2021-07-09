const User = require('../models/users');
const error = require('../errors');
const userService = require('./user');
const { now } = require('mongoose');
const { findOneAndUpdate } = require('../models/users');

module.exports = {
  findFriends,
  findFriendById,
  requestFriend,
  acceptFriendRequest,
  deleteFriend,
}

async function findFriends (userId, state) {
  await userService.checkUserIdValidAndExist(userId);

  userWithFriends = await User.findById(userId).populate('friends.friendId', '_id name email');

  friends = userWithFriends.friends;
  result = []
  if (state) {
    for (friend of friends) {
      if (friend.state == state) {
        result.push(friend);
      }
    }
  } else {
    result = friends;
  }

  return result;
}

async function findFriendById (userId, targetId) {
  await userService.checkUserIdValidAndExist(userId);
  await userService.checkUserIdValidAndExist(targetId);

  const user = await User.findOne(
    { _id: userId },
    { friends: {$elemMatch: {friendId: targetId}} },
  ).exec();

  if (user) return user.friends[0];
  else return undefined;
}

async function requestFriend (userId, targetId) {
  const friendState = await findFriendById(userId, targetId);
  if (userId == targetId) throw error.FRIEND.FRIEND_SLEF_INVALID;
  if (friendState) {
    if (friendState.state == 'success') throw error.FRIEND.ALREADY_FRIEND;
    if (friendState.state == 'requesting') throw error.FRIEND.ALREADY_REQUESTING;
    if (friendState.state == 'requested') throw error.FRIEND.ALREADY_REQUESTED;
  }

  await User.findOneAndUpdate(
      {_id: userId},
      {
        $addToSet: {
          friends: {
            friendId: targetId,
            state: 'requesting',
            updateAt: now(),
          }
        }
      }
  ).exec();

  await User.findOneAndUpdate(
      {_id: targetId},
      {
        $addToSet: {
          friends: {
            friendId: userId,
            state: 'requested',
            updateAt: now(),
          }
        }
      }
  ).exec();
}

async function acceptFriendRequest (userId, targetId) {
  const friendState = await findFriendById(userId, targetId);
  if (!friendState) throw error.FRIEND.NOT_REQUESTED_BY_TARGET;
  if (friendState.state != 'requested') throw error.FRIEND.NOT_REQUESTED_BY_TARGET;

  const currentTime = now();
  await User.findOneAndUpdate(
      {
        _id: userId,
        friends: {$elemMatch: {friendId: targetId, state: 'requested'}},
      },
      {$set: {
        'friends.$.state': 'success',
        'friends.$.updateAt': currentTime,
      }},
  ).exec();

  await User.findOneAndUpdate(
      {
        _id: targetId,
        friends: {$elemMatch: {friendId: userId, state: 'requesting'}},
      },
      {$set: {
        'friends.$.state': 'success',
        'friends.$.updateAt': currentTime,
      }},
  ).exec();  
}

async function deleteFriend (userId, targetId) {
  const friendState = await findFriendById(userId, targetId);
  if (!friendState) throw error.FRIEND.NOT_FRIEND;

  await User.findOneAndUpdate(
      {_id: userId},
      {$pull: { friends: {friendId: targetId}}},
  ).exec();

  await User.findOneAndUpdate(
      {_id: targetId},
      {$pull: { friends: {friendId: userId}}},
  ).exec();
}
