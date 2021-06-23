const friendService = require('../services/friend');

module.exports = {
  getFriends,
  requestFriend,
  acceptFriend,
  deleteFriend,
};

async function getFriends (req, res, next) {
  let friends;
  try {
    friends = await friendService.findFriends(req.query.userID);
  } catch (e) {
    return next(e);
  }

  return res.json({friends}).status(200);
}

async function requestFriend (req, res, next) {
  const userId = req.user._id;
  const targetId = req.body.friendID;

  try {
    await friendService.requestFriend(userId, targetId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);
}

async function acceptFriend (req, res, next) {
  const userId = req.user._id;
  const targetId = req.params.friendID;

  try {
    await friendService.acceptFriendRequest(userId, targetId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);
}

async function deleteFriend (req, res, next) {
  const userId = req.user._id;
  const targetId = req.params.friendID;

  try {
    await friendService.deleteFriend(userId, targetId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);

}