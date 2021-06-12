const config = require('../config');
const jwt = require('jsonwebtoken');

function getTokenFromHeader (req) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
}

module.exports = async function (req, res, next) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  const userData = jwt.verify(token, config.jwt.secret);
  req.user = userData;
  return next();
} 
