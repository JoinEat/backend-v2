const userService = require('../services/user');
const error = require('../errors');

module.exports = async function (req, res, next) {
  if (!req.user) {
    return next(error.AUTH.AUTH_FAIL);
  }
  if (!userService.userIdExist(req.user._id)) {
    return next(error.AUTH.USER_NOT_EXISTS);
  }
  return next();
}
