const eventService = require('../services/event');

module.exports = {
  getEvents,
  getEventsByDistance,
  createEvent,
  getEventById,
  updateEvent,
  updateEventLocation,
  deleteEvent,
  getMembers,
  getInvitations,
  getRequests,
  sendInvitation,
  sendRequest,
  acceptInvitation,
  acceptRequest,
  leaveEvent,
  getMessages,
  createMessage,
  submitForm,
};

async function getEvents (req, res, next) {
  let events;

  try {
    events = await eventService.getEvents(req.query, req.user && req.user._id);
  } catch (e) {
    return next(e);
  }

  return res.json({events}).status(200);
}

async function getEventsByDistance (req, res, next) {
  const {longitude, latitude} = req.query;

  let events;
  try {
    events = await eventService.getEventsSortByDistance(longitude, latitude);
  } catch (e) {
    return next(e);
  }

  return res.json({events}).status(200);
}

async function createEvent (req, res, next) {
  userId = req.user._id;
  title = req.body.title;

  data = req.body;
  delete data.title;

  let newEvent;
  try {
    newEvent = await eventService.createEvent(userId, title, data);
  } catch (e) {
    return next(e);
  }

  return res.json({event: newEvent}).status(200);
}

async function getEventById (req, res, next) {
  eventId = req.params.eventID;
  let foundEvent;
  try {
    foundEvent = await eventService.getEventById(eventId, req.user._id);
  } catch (e) {
    return next(e);
  }

  return res.json({event: foundEvent}).status(200);
}

async function updateEvent (req, res, next) {
  const data = req.body;
  const eventId = req.params.eventID;

  let newEvent;
  try {
    newEvent = await eventService.updateEvent(eventId, req.user._id, data);
  } catch (e) {
    return next(e);
  }

  return res.json({event: newEvent}).status(200);
}

async function updateEventLocation (req, res, next) {
  const {longitude, latitude} = req.body;
  const eventId = req.params.eventID;
  const userId = req.user._id;
  
  let updatedEvent;
  try {
    updatedEvent = await eventService.updateEventLocation(eventId, userId, longitude, latitude);
  } catch (e) {
    return next(e);
  }

  return res.json({event: updatedEvent}).status(200);
}

async function deleteEvent (req, res, next) {
  const eventId = req.params.eventID;

  try {
    await eventService.deleteEvent(eventId, req.user._id);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);
}

async function getMembers (req, res, next) {
  const eventId = req.params.eventID;
  let members;
  try {
    members = await eventService.getMembers(eventId);
  } catch (e) {
    return next(e);
  }
  return res.json({members}).status(200);
}

async function getInvitations (req, res, next) {
  const eventId = req.params.eventID;
  let invitations;
  try {
    invitations = await eventService.getInvitations(eventId);
  } catch (e) {
    return next(e);
  }
  return res.json({invitations}).status(200);
}

async function getRequests (req, res, next) {
  const eventId = req.params.eventID;
  let requests;
  try {
    requests = await eventService.getRequests(eventId);
  } catch (e) {
    return next(e);
  }
  return res.json({requests}).status(200);
}

async function sendInvitation (req, res, next) {
  const eventId = req.params.eventID;
  const targetId = req.body.targetID;
  const userId = req.user._id;
  try {
    await eventService.inviteToEvent(eventId, userId, targetId);
  } catch(e) {
    return next(e);
  }
  return res.json({message: 'SUCCESS'});
}

async function sendRequest (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;
  try {
    await eventService.requestToJoin(eventId, userId);
  } catch(e) {
    return next(e);
  }
  return res.json({message: 'SUCCESS'});

}

async function acceptInvitation (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;
  try {
    await eventService.acceptInvitation(eventId, userId);
  } catch(e) {
    return next(e);
  }
  return res.json({message: 'SUCCESS'});

}

async function acceptRequest (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;
  const targetId = req.params.targetID;
  try {
    await eventService.acceptRequest(eventId, userId, targetId);
  } catch(e) {
    return next(e);
  }
  return res.json({message: 'SUCCESS'});
}

async function leaveEvent (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;
  try {
    await eventService.leaveEvent(eventId, userId);
  } catch(e) {
    return next(e);
  }
  return res.json({message: 'SUCCESS'});
}

async function getMessages (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;
  const {nextKey} = req.query;
  console.log('getMessage', eventId, userId, nextKey);

  try {
    const messages = await eventService.getEventMessages(eventId, userId, nextKey);
    return res.json({messages});
  } catch (e) {
    return next(e);
  }
}

async function createMessage (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;
  const {text} = req.body;

  try {
    await eventService.createEventMessage(eventId, userId, text);
    return res.json({message: 'SUCCESS'});
  } catch (e) {
    return next(e);
  }
}

async function submitForm (req, res, next) {
  const eventId = req.params.eventID;
  const userId = req.user._id;

  try {
    await eventService.submitForm(eventId, userId, req.body);
    return res.json({message: 'SUCCESS'});
  } catch (e) {
    return next(e);
  }
}