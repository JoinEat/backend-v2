const error = require('../errors');
const Event = require('../models/event');
const userService = require('./user');

const IMMUTABLE_FIELDS = ['creator', 'createAt'];

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  checkEventIdValidAndExist,
}

async function getEvents () {
  return Event.find().exec();
}


async function eventIdExist (eventId) {
  let event;
  try {
    event = await Event.findById(eventId);
  } catch (e) {
    if (e.name == 'CastError') throw error.EVENT.EVENTID_NOT_VALID;
    throw e;
  }
  return !!event;
}

async function checkEventIdValidAndExist (eventId) {
  if (!await eventIdExist(eventId)) throw error.EVENT.EVENT_NOT_FOUND;
}

async function getEventById (eventId) {
  await checkEventIdValidAndExist(eventId);

  return Event.findById(eventId).exec();
}

async function createEvent (userId, title) {
  await userService.checkUserIdValidAndExist(userId);
  
  newEvent = new Event({title, creator: userId});
  resEvent = await newEvent.save();

  return resEvent;
}

async function updateEvent (eventId, data) {
  await checkEventIdValidAndExist(eventId);
  for (key in data) {
    if (IMMUTABLE_FIELDS.includes(key)) {
      throw error.EVENT.FIELD_NOT_MUTABLE;
    }
  }

  updatedEvent = await Event.findOneAndUpdate(
      {_id: eventId},
      {$set: data},
      {new: true},
  ).exec();

  return updatedEvent;
}

async function deleteEvent (eventId) {
  await checkEventIdValidAndExist(eventId);

  await Event.findOneAndDelete({_id: eventId}).exec();
}