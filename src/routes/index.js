const {Router} = require('express');
const userRoute = require('./users');
const friendRoute = require('./friend');

module.exports = function () {
  const router = new Router();

  router.use('/users', userRoute());
  router.use('/friends', friendRoute());

  return router;
}
