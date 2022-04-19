const {Router} = require('express');
const userController = require('../controller/users');
const {isAuth, attachUser} = require('../middleware');

export default function () {
  const router = new Router();

  router.get('/', attachUser, userController.listUsers);
  router.put('/', attachUser, isAuth, userController.updateUser);
  router.post('/', userController.signUp);

  router.get('/myInvitations', attachUser, isAuth, userController.getMyInvitations);
  router.get('/myCurrentEvents', attachUser, isAuth, userController.getMyCurrentEvents);
  router.get('/myEventForms', attachUser, isAuth, userController.getMyEventForms);

  router.get('/:userId', attachUser, isAuth, userController.getUserWithId);

  router.post('/login', userController.login);

  return router;
}
