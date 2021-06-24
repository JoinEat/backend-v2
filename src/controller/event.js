const eventService = require('../services/event');

module.exports = {
  getEvents,
  createEvent,
  getEventById,
  updateEvent,
  deleteEvent,
};

async function getEvents (req, res, next) {
  let events;
  try {
    events = await eventService.getEvents();
  } catch (e) {
    return next(e);
  }

  return res.json({events}).status(200);
}

async function createEvent (req, res, next) {
  userId = req.user._id;
  title = req.body.title;

  let newEvent;
  try {
    newEvent = await eventService.createEvent(userId, title);
  } catch (e) {
    return next(e);
  }

  return res.json({event: newEvent}).status(200);
}

async function getEventById (req, res, next) {
  eventId = req.params.eventID;
  let foundEvent;
  try {
    foundEvent = await eventService.getEventById(eventId);
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
    newEvent = await eventService.updateEvent(eventId, data);
  } catch (e) {
    return next(e);
  }

  return res.json({event: newEvent}).status(200);
}

async function deleteEvent (req, res, next) {
  const eventId = req.params.eventID;

  try {
    await eventService.deleteEvent(eventId);
  } catch (e) {
    return next(e);
  }

  return res.json({message: 'SUCCESS'}).status(200);

}