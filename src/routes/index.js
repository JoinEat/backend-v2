const {Router} = require('express');
const userRoute = require('./users');
const friendRoute = require('./friend');
const eventRoute = require('./event');
const verifyRoute = require('./verify');

module.exports = function () {
  const router = new Router();

  router.use('/users', userRoute());
  router.use('/friends', friendRoute());
  router.use('/events', eventRoute());
  router.use('/verify', verifyRoute());

  return router;
}
