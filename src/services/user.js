const User = require('../models/users');
const error = require('../errors');
const mongoose = require('mongoose');

const MUTABLE_FIELDS = ['realName', 'nickName', 'school', 'gender', 'department', 'avatar', 'public'];
const SEARCH_FIELDS = ['email', 'name', 'realName', 'nickName', 'school', 'gender', 'department'];
const PUBLIC_FIELDS = ['avatar', 'name', '_id', 'nickName', 'public'];
const PRIVATE_FIELDS = ['email', 'password', 'verifyStatus'];
const PROTECTED_FIELDS = ['realName', 'school', 'gender', 'department', 'friends', 'eventInvitation', 'currentEvent'];
const PRIVATE_SELECT = PRIVATE_FIELDS.map(x => '-' + x).join(' ');

module.exports = {
  findUsers,
  userIdExist,
  findUserById,
  updateUserById,
  checkUserIdValidAndExist,
  getCurrentEvents,
  getEventInvitations,
  SEARCH_FIELDS,
  PUBLIC_FIELDS,
}

/**
 * Check if users are success friend
 * @param userId 
 * @param targetId 
 * @returns Boolean
 */
async function isFriendOf (userId, targetId) {
  if (!userId || !targetId) return false;
  const cur = await User.findById(userId, {
    friends: {$elemMatch: {friendId: targetId}},
  });
  return (cur.friends.length && cur.friends[0].state == 'success');
}

/**
 * Search user with filters (the projected fields are determined by public field)
 * @param filter 
 * @param excludeFriendOfUser
 * @param nickNameSubstr 
 * @param limit 
 * @param nextKey 
 * @returns an array of matched user
 */
async function findUsers (filter, excludeFriendOfUser, nickNameSubstr, limit, nextKey, exclude) {
  for (key in filter) {
    if (!SEARCH_FIELDS.includes(key)) throw error.USER.FIELD_NOT_SEARCHABLE;
  }
  if (excludeFriendOfUser) {
    const excludeId = mongoose.Types.ObjectId(excludeFriendOfUser);
    filter['friends.friendId'] = {$ne: excludeId};
  }
  if (nickNameSubstr) {
    filter['nickName'] = {$regex: nickNameSubstr};
  }

  if (exclude) {
    if (exclude.member) {
      const eventId = mongoose.Types.ObjectId(exclude.member);
      filter['currentEvent'] = {$ne: eventId};
    }
    if (exclude.invitation) {
      const eventId = mongoose.Types.ObjectId(exclude.invitation);
      filter['eventInvitations.eventId'] = {$ne: eventId};
    }
  }
  console.log(filter);

  // pagnination
  if (!limit || limit > 100) limit = 100;
  if (nextKey) {
    filter['_id'] = {$gt: nextKey};
  }

  selection = PUBLIC_FIELDS.join(' ');

  projectParam = {};
  for (fields of PUBLIC_FIELDS) {
    projectParam[fields] = 1;
  }

  for (fields of PROTECTED_FIELDS) {
    projectParam[fields] = {$cond:{
        if: {$eq: ['$public', false]},
        then: '$$REMOVE',
        else: '$' + fields
      }};
  }

  const query = await User.aggregate([
    {$match: filter},
    {$limit: limit},
    {$project: projectParam},
  ]);

  return query;
}

/**
 * Check if userId exist
 * @param userId 
 * @returns Boolean
 */
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

/**
 * Throw error if userId not valid or not exist
 * @param userId 
 */
async function checkUserIdValidAndExist (userId) {
  if (!await userIdExist(userId)) throw error.USER.USER_NOT_FOUND;
}

/**
 * Get targetId info with userId's permission.
 * If permission is true, treat as super user.
 * @param userId 
 * @param targetId 
 * @param permission 
 * @returns The found user with its visible fields.
 */
async function findUserById (userId, targetId, permission) {
  await checkUserIdValidAndExist(targetId);
  let user = await User.findById(targetId)
      .populate('currentEvent', 'title')
      .populate('eventInvitations.eventId', 'title')
      .select(PRIVATE_SELECT);
  user = user.toObject();

  if (!permission && targetId != userId && ! await isFriendOf(userId, targetId) && !user.public) {
    user = Object.keys(user)
      .filter(key => PUBLIC_FIELDS.includes(key))
      .reduce((obj, key) => {
        obj[key] = user[key];
        return obj;
      }, {});
  }
  return user;
}

async function getCurrentEvents (userId) {
  await checkUserIdValidAndExist(userId);
  let user = await User.findById(userId)
      .populate('currentEvent')
  return user.currentEvent;
}

async function getEventInvitations (userId) {
  await checkUserIdValidAndExist(userId);
  let user = await User.findById(userId)
      .populate('eventInvitations.eventId');
  return user.eventInvitations;
}

/**
 * Update userId's data
 * @param userId 
 * @param data 
 * @returns the new user's data
 */
async function updateUserById (userId, data) {
  for (key in data) {
    if (!MUTABLE_FIELDS.includes(key)) {
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
