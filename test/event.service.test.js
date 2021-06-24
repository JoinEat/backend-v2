const chai = require('chai')
var chaiAsPromised = require("chai-as-promised");
const userService = require('../src/services/user');
const authService = require('../src/services/auth');
const eventService = require('../src/services/event');
const { createUsers } = require('./user.helper');
const { EVENT_NOT_FOUND, EVENTID_NOT_VALID, FIELD_NOT_MUTABLE } = require('../src/errors/event');
const { create } = require('../src/models/event');

chai.use(chaiAsPromised);

const expect = chai.expect;

async function createEvents (count = 3) {
  const users = await createUsers(3);
  let eventList = [];
  for (i=0; i<count; i++) {
    item = await eventService.createEvent(users[i]._id, `test_event${i}`);
    eventList.push(item);
  }
  return eventList;
}

describe('Event service', function () {
  describe('getEvents', function () {
    it('Should return all events', async function () {
      // Arrange
      await createEvents(3);
      
      // Act
      events = await eventService.getEvents();

      // Assert
      expect(events).to.have.lengthOf(3);
    });
  });

  describe('checkEventIdValidAndExist', function () {
    it('When eventId is valid and exist, resolve undefined', async function () {
      // Arrange
      events = await createEvents(2);
      eventId = events[0]._id;

      // Act
      const prom = eventService.checkEventIdValidAndExist(eventId);

      // Assert
      expect(prom).to.be.fulfilled;
    });

    it('When eventId not exists, throw EVENT_NOT_FOUND', async function () {
      // Arrange
      var eventId = require('mongoose').Types.ObjectId();

      // Act
      const prom = eventService.checkEventIdValidAndExist(eventId);

      // Assert
      expect(prom).to.be.rejected.
        and.eventually.be.equal(EVENT_NOT_FOUND);
    });

    it('When eventId invalid, throw error', async function () {
      // Arrange
      const eventId = 123;

      // Act
      const prom = eventService.checkEventIdValidAndExist(eventId);

      // Assert
      await expect(prom).to.eventually.be.rejected
          .and.eventually.be.equal(EVENTID_NOT_VALID);
    });
  });

  describe('getEventById', function () {
    it('When eventId is valid, return the event with eventId', async function () {
      // Arrange
      const events = await createEvents(3);
      const eventId = events[0]._id;

      // Act
      const foundEvent = await eventService.getEventById(eventId);

      // Assert
      expect(foundEvent).to.have.deep.property('_id', eventId);
    });
  });

  describe('createEvent', function () {
    it('When userId, title are valid, create a new event with title', async function () {
      // Arrange
      const users = await createUsers(3);
      const userId = users[0]._id;

      // Act
      const newEvent = await eventService.createEvent(userId, 'test_event');

      // Assert
      const prom = eventService.checkEventIdValidAndExist(newEvent._id);
      expect(prom).to.be.fulfilled;
    });
  });

  describe('updateEvent', function () {
    it('When eventId is valid and fields are mutable, update and return new.', async function () {
      // Arrange
      const events = await createEvents(3);

      // Act
      const updatedEvent = await eventService.updateEvent(events[0]._id, {position: 'KFC'});

      // Assert
      expect(updatedEvent).to.have.property('position', 'KFC');
    });

    it('When eventId is valid but fields are immutable, throw FIELD_NOT_MUTABLE', async function () {
      // Arrange
      const events = await createEvents(3);
      var userId = require('mongoose').Types.ObjectId();

      // Act
      const updatedEvent = eventService.updateEvent(events[0]._id, {creator: userId});

      // Assert
      expect(updatedEvent).to.be.rejected.
        and.to.eventually.equal(FIELD_NOT_MUTABLE);
    });
  });
});