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
};

async function listUsers (req, res) {
  let excludeFriends = undefined;
  if (req.query.excludeFriends == 'true' && req.user) {
    excludeFriends = req.user._id;
  }

  query = req.query || {};
  filter = Object.keys(query)
      .filter(key => userService.SEARCH_FIELDS.includes(key))
      .reduce((obj, key) => {
          obj[key] = query[key];
          return obj;
      }, {});

  let nickNameSubstr = req.query.nickNameContain;

  // pagnination
  const limit = parseInt(req.query.limit);
  const nextKey = req.query.nextKey;

  const users = await userService.findUsers(filter, excludeFriends, nickNameSubstr, limit, nextKey);
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