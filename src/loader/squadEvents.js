const {EventEmitter} = require("events");
const SquadEvents = require('../models/squadEvents');
const {now} = require("mongoose");
const Event = require('../models/event');
const EventService = require('../services/event');

const squadEventsEmitter = new EventEmitter();

async function fetchSquadEvents () {
  const pending = await SquadEvents.find({'scheduleAt' : {$lte: now()}});
  for (const squadEvent of pending) {
    squadEventsEmitter.emit(squadEvent.type, squadEvent.event);
    await SquadEvents.findByIdAndDelete(squadEvent._id);
  }
  return;
}

module.exports = async function () {
  /*
  squadEventsEmitter.on('ping', function (eventId) {
    console.log('pong', eventId);
  });

  const anyEvent = await Event.findOne();
  const test = new SquadEvents({event: anyEvent._id, type: 'ping', scheduleAt: Date.now() + 5000});
  await test.save();
   */

  squadEventsEmitter.on('destroy', async function (eventId) {
    await EventService.destroyEvent(eventId);
  });

  squadEventsEmitter.on('sendForm', async function (eventId) {
    await EventService.sendEventForm(eventId);
  });


  setInterval(async () => {
    await fetchSquadEvents();
  }, 1000);

}