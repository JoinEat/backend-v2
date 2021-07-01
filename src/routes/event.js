const {Router} = require('express');
const eventController = require('../controller/event');
const {isAuth, attachUser} = require('../middleware');

module.exports = function () {
  const router = new Router();

  router.get('/', eventController.getEvents);
  router.post('/', attachUser, isAuth, eventController.createEvent);

  router.get('/:eventID/invitations', attachUser, isAuth, eventController.getInvitations);
  router.post('/:eventID/invitations', attachUser, isAuth, eventController.sendInvitation);
  router.put('/:eventID/invitations', attachUser, isAuth, eventController.acceptInvitation);

  router.get('/:eventID/requests', attachUser, isAuth, eventController.getRequests);
  router.post('/:eventID/requests', attachUser, isAuth, eventController.sendRequest);
  router.put('/:eventID/requests/:targetID', attachUser, isAuth, eventController.acceptRequest);

  router.get('/:eventID/members', attachUser, isAuth, eventController.getMembers);
  router.delete('/:eventID/members', attachUser, isAuth, eventController.leaveEvent);

  router.get('/:eventID', eventController.getEventById);
  router.put('/:eventID', attachUser, isAuth, eventController.updateEvent);
  router.delete('/:eventID', attachUser, isAuth, eventController.deleteEvent);

  return router;
}