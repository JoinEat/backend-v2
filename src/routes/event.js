const {Router} = require('express');
const eventController = require('../controller/event');
const {isAuth, attachUser} = require('../middleware');

module.exports = function () {
  const router = new Router();

  router.get('/', eventController.getEvents);
  router.post('/', attachUser, isAuth, eventController.createEvent);
  router.get('/:eventID', eventController.getEventById);
  router.put('/:eventID', attachUser, isAuth, eventController.updateEvent);
  router.delete('/:eventID', attachUser, isAuth, eventController.deleteEvent);

  return router;
}