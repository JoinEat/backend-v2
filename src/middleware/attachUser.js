const config = require('../config');
const jwt = require('jsonwebtoken');
const error = require('../errors');

function getTokenFromHeader (req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
}

module.exports = async function (req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  let userData;
  try {
    userData = jwt.verify(token, config.jwt.secret);
  } catch {
    return next(error.AUTH.AUTH_FAIL); // token invalid
  }
  req.user = userData.data;
  return next();
} 
