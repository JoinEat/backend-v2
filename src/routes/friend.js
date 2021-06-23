const {Router} = require('express');
const friendController = require('../controller/friend');
const {isAuth, attachUser} = require('../middleware');

module.exports = function () {
  const router = new Router();

  router.get('/', friendController.getFriends);
  router.post('/', attachUser, isAuth, friendController.requestFriend);
  router.put('/:friendID', attachUser, isAuth, friendController.acceptFriend);
  router.delete('/:friendID', attachUser, isAuth, friendController.deleteFriend);

  return router;
}