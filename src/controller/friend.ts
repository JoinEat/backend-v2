const friendService = require('../services/friend');
import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "../interfaces/express_interface";

module.exports = {
  getFriends,
  requestFriend,
  acceptFriend,
  deleteFriend,
};

async function getFriends (req: Request, res: Response, next: NextFunction) {
  let friends;

  const stateFilter = req.query.state;

  try {
    friends = await friendService.findFriends(req.query.userID, stateFilter);
  } catch (e) {
    return next(e);
  }

  return res.json({friends}).status(200);
}

async function requestFriend (req: RequestWithUser, res: Response, next: NextFunction) {
  const userId = req.user._id;
  const targetId = req.body.friendID;

  try {
    await friendService.requestFriend(userId, targetId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);
}

async function acceptFriend (req: RequestWithUser, res: Response, next: NextFunction) {
  const userId = req.user._id;
  const targetId = req.params.friendID;

  try {
    await friendService.acceptFriendRequest(userId, targetId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);
}

async function deleteFriend (req: RequestWithUser, res: Response, next: NextFunction) {
  const userId = req.user._id;
  const targetId = req.params.friendID;

  try {
    await friendService.deleteFriend(userId, targetId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);

}