const {Router} = require('express');
const userController = require('../controller/users');
const {isAuth, attachUser} = require('../middleware');

module.exports = function () {
  const router = new Router();

  router.get('/', attachUser, isAuth, userController.sendVerifyMail);
  router.get('/:userId/:code', userController.verifyWithCode);


  return router;
}
