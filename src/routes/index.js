const {Router} = require('express');
const userRoute = require('./users');
const friendRoute = require('./friend');
const eventRoute = require('./event');

module.exports = function () {
  const router = new Router();

  router.use('/users', userRoute());
  router.use('/friends', friendRoute());
  router.use('/events', eventRoute());

  return router;
}
