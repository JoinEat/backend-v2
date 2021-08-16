const User = require('../models/users');
const error = require('../errors');
const mongoose = require('mongoose');

const MUTABLE_FIELDS = ['realName', 'nickName', 'school', 'gender', 'department', 'avatar', 'public'];
const SEARCH_FIELDS = ['email', 'name', 'realName', 'nickName', 'school', 'gender', 'department', 'nickNameContain'];
const PUBLIC_FIELDS = ['avatar', 'name', '_id', 'nickName', 'public'];
const PRIVATE_FIELDS = ['email', 'password', 'verifyStatus'];
const PROTECTED_FIELDS = ['realName', 'school', 'gender', 'department', 'friends', 'eventInvitation', 'currentEvent'];
const PRIVATE_SELECT = PRIVATE_FIELDS.map(x => '-' + x).join(' ');
const EXCLUDE_FIELDS = ['notMemberOf', 'notInvitationOf', 'notFriendOf'];

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
  EXCLUDE_FIELDS,
}

/**
 * buildProjectParams for public fields
 * @returns {{}}
 */
function buildPublicProjectParams () {
  const projectParam = {};
  for (const fields of PUBLIC_FIELDS) {
    projectParam[fields] = 1;
  }

  for (const fields of PROTECTED_FIELDS) {
    projectParam[fields] = {$cond:{
        if: {$eq: ['$public', false]},
        then: '$$REMOVE',
        else: '$' + fields
      }};
  }
  return projectParam;
}
const publicProjectParams = buildPublicProjectParams();

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
  return (cur.friends.length && cur.friends[0].state === 'success');
}

/**
 * Add not equal id query to filter
 * @param filter
 * @param field
 * @param id
 */
function addNotEqualIdToFilter (filter, field, id) {
  filter[field] = {$ne: mongoose.Types.ObjectId(id)};
}

/**
 * Search user with filters (the projected fields are determined by public field)
 * @param search
 * @param exclude
 * @param limit
 * @param nextKey
 * @returns an array of matched user
 */
async function findUsers (search, exclude, limit, nextKey) {
  for (const key in search) {
    if (!SEARCH_FIELDS.includes(key)) throw error.USER.FIELD_NOT_SEARCHABLE;
  }
  let filter = search;

  if (filter.nickNameContain) {
    filter['nickName'] = {$regex: filter.nickNameContain};
    delete filter.nickNameContain;
  }

  const {notFriendOf, notMemberOf, notInvitationOf} = exclude;
  if (notFriendOf) addNotEqualIdToFilter(filter, 'friends.friendId', notFriendOf);
  if (notMemberOf) addNotEqualIdToFilter(filter, 'currentEvent', notMemberOf);
  if (notInvitationOf) addNotEqualIdToFilter(filter, 'eventInvitations.eventId', notInvitationOf);

  // pagination
  if (!limit || limit > 100) limit = 100;
  if (nextKey) filter['_id'] = {$gt: nextKey};

  const query = await User.aggregate([
    {$match: filter},
    {$limit: limit},
    {$project: publicProjectParams},
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
