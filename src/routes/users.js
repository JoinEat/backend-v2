const {Router} = require('express');
const userController = require('../controller/users');
const {isAuth, attachUser} = require('../middleware');

module.exports = function () {
  const router = new Router();

  router.get('/verify/:userId/:code', userController.verifyWithCode);
  router.get('/verify', attachUser, isAuth, userController.sendVerifyMail);

  router.get('/', userController.listUsers);
  router.put('/', attachUser, isAuth, userController.updateUser);
  router.post('/', userController.signUp);

  router.get('/:userId', attachUser, isAuth, userController.getUserWithId);

  router.post('/login', userController.login);

  return router;
}
