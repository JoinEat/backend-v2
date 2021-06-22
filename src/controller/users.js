const userService = require('../services/user');
const authService = require('../services/auth');

module.exports = {
  listUsers,
  signUp,
  login,
  getUserWithId,
  updateUser,
}

async function listUsers (req, res) {
  const users = await userService.findUsers();
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
    next(e);
  }
  
  return res.json({user, token}).status(200);
}

async function getUserWithId (req, res, next) {
  const userId = req.params.userId;
  let user;
  try {
    user = await userService.findUserById(userId);
  } catch (e) {
    return next(e);
  }
  return res.json({user}).status(200);
}

async function updateUser (req, res) {
 
}
