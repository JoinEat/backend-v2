const {Router} = require('express');
const userRoute = require('./users');

module.exports = function () {
  const router = new Router();

  router.use('/users', userRoute());
  return router;
}
