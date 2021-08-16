const userService = require('../services/user');
const authService = require('../services/auth');

module.exports = {
  listUsers,
  signUp,
  login,
  getUserWithId,
  updateUser,
  sendVerifyMail,
  verifyWithCode,
  getMyCurrentEvents,
  getMyInvitations,
};

function filterObjectKeysWithArray (from, fields) {
  return Object.keys(from)
      .filter(key => fields.includes(key))
      .reduce((obj, key) => {
        obj[key] = from[key];
        return obj;
      }, {});
}

async function listUsers (req, res) {
  const query = req.query || {};

  const filter = filterObjectKeysWithArray(query, userService.SEARCH_FIELDS);
  const exclude = filterObjectKeysWithArray(query, userService.EXCLUDE_FIELDS);
  if (exclude.friendOf === 'true' && req.user) exclude.friendOf = req.user._id;

  // pagination
  const limit = parseInt(query.limit);
  const nextKey = query.nextKey;

  const users = await userService.findUsers(filter, exclude, limit, nextKey);
  return res.json({users}).status(200);
}

async function signUp (req, res, next) {
  const {email, password, name} = req.body;

  let user
  try {
    user = await authService.signUp(email, password, name);
  } catch (e) {
    return next(e);
  }

  return res.json({user}).status(200);
}

async function login (req, res, next) {
  const {email, password} = req.body;

  let user, token;
  try {
    ({user, token} = await authService.login(email, password));
  } catch (e) {
    return next(e);
  }
  
  return res.json({user, token}).status(200);
}

async function getUserWithId (req, res, next) {
  const userId = req.params.userId;
  let user;
  try {
    user = await userService.findUserById(req.user._id, userId);
  } catch (e) {
    return next(e);
  }
  return res.json({user}).status(200);
}

async function updateUser (req, res, next) {
  const userId = req.user._id;
  
  let user;
  try {
    user = await userService.updateUserById(userId, req.body);
  } catch (e) {
    return next(e);
  }

  return res.json({user}).status(200);
}

async function sendVerifyMail (req, res, next) {
  const userId = req.user._id;

  try {
    await authService.sendVerifyMail(userId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);
}

async function verifyWithCode (req, res, next) {
  const userId = req.params.userId;
  const code = req.params.code;

  let user;
  try {
    user = await authService.verifyWithCode(userId, code);
  } catch (e) {
    return next(e);
  }

  return res.json({user}).status(200);
}

async function getMyCurrentEvents (req, res, next) {
  const userId = req.user._id;
  let events;
  try {
    events = await userService.getCurrentEvents(userId);
  } catch (e) {
    return next(e);
  }

  return res.json({events}).status(200);
}

async function getMyInvitations (req, res, next) {
  const userId = req.user._id;
  let events;
  try {
    events = await userService.getEventInvitations(userId);
  } catch (e) {
    return next(e);
  }

  return res.json({events}).status(200);
}