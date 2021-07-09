const chai = require('chai')
var chaiAsPromised = require("chai-as-promised");
const userService = require('../src/services/user');
const authService = require('../src/services/auth');
const eventService = require('../src/services/event');
const { createUsers } = require('./user.helper');
const { EVENT_NOT_FOUND, EVENTID_NOT_VALID, FIELD_NOT_MUTABLE, ALREADY_IN_OTHER_EVENT } = require('../src/errors/event');
const { create } = require('../src/models/event');
const Event = require('../src/models/event');
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
      const user = await userService.findUserById(null, userId, true);
      expect(user).to.have.deep.property('currentEvent', newEvent._id);
    });

    it('When user currentEvent is set, raise ALREADY_IN_OTHER_EVENT', async function () {
      // Arrange
      const users = await createUsers(3);
      const userId = users[0]._id;
      await eventService.createEvent(userId, 'test_event');

      // Act
      const prom = eventService.createEvent(userId, 'test_event');

      await expect(prom).to.eventually.be.rejected
          .and.eventually.be.equal(ALREADY_IN_OTHER_EVENT);

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

  describe('getInvitations', function() {
    it('When eventId is valid, return all invitaion', async function () {
      // Arrange
      const users = await createUsers(3);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      await eventService.inviteToEvent(curEvent._id, users[0]._id, users[1]._id);
      await eventService.requestToJoin(curEvent._id, users[2]._id);

      // Act
      const result = await eventService.getInvitations(curEvent._id);

      // Assert
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.deep.property('memberId', users[1]._id);
    });
  });

  describe('getInvitations', function() {
    it('When eventId is valid, return all invitaion', async function () {
      // Arrange
      const users = await createUsers(3);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      await eventService.inviteToEvent(curEvent._id, users[0]._id, users[1]._id);
      await eventService.requestToJoin(curEvent._id, users[2]._id);

      // Act
      const result = await eventService.getRequests(curEvent._id);

      // Assert
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.deep.property('memberId', users[2]._id);
    });
  });

  describe('getMembers', function() {
    it('When eventId is valid, return all invitaion', async function () {
      // Arrange
      const users = await createUsers(3);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');

      // Act
      const result = await eventService.getMembers(curEvent._id);

      // Assert
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.deep.property('memberId', users[0]._id);
    });
  });

  describe('inviteToEvent', function() {
    it('When invite sent, modify both event.members and user.invitations', async function () {
      // Arrange
      const users = await createUsers(2);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      const eventId = curEvent._id;

      // Act
      await eventService.inviteToEvent(eventId, users[0]._id, users[1]._id);

      // Assert
      const result = await eventService.getInvitations(curEvent._id);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.deep.property('memberId', users[1]._id);

      const user1 = await userService.findUserById(null, users[1]._id, true);
      expect(user1.eventInvitations).to.have.lengthOf(1);
      expect(user1.eventInvitations[0]).to.have.deep.property('eventId', eventId);
    });
  });

  describe('acceptInvitaion', function() {
    it('When invite accepted, modify event.members and pull user.invitations', async function () {
      // Arrange
      const users = await createUsers(2);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      const eventId = curEvent._id;
      await eventService.inviteToEvent(eventId, users[0]._id, users[1]._id);

      // Act
      await eventService.acceptInvitation(eventId, users[1]._id);

      // Assert
      const result = await eventService.getMembers(curEvent._id);
      expect(result).to.have.lengthOf(2);
      expect(result[1]).to.have.deep.property('memberId', users[1]._id);

      const user1 = await userService.findUserById(null, users[1]._id, true);
      expect(user1.eventInvitations).to.have.lengthOf(0);
      expect(user1).to.have.deep.property('currentEvent', eventId);
    });

    it('When user is in other event, throw ALREADY_IN_OTHER_EVENT', async function () {
      // Arrange
      const users = await createUsers(2);
      const event0 = await eventService.createEvent(users[0]._id, 'test event');
      const event1 = await eventService.createEvent(users[1]._id, 'test event');
      await eventService.inviteToEvent(event0._id, users[0]._id, users[1]._id);

      // Act
      const prom = eventService.acceptInvitation(event0._id, users[1]._id);

      // Assert
      await expect(prom).to.eventually.be.rejected
          .and.eventually.be.equal(ALREADY_IN_OTHER_EVENT);
    });
  });

  describe('requestToJoin', function() {
    it('When request sent, modify event.members', async function () {
      // Arrange
      const users = await createUsers(2);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      const eventId = curEvent._id;

      // Act
      await eventService.requestToJoin(eventId, users[1]._id);

      // Assert
      const result = await eventService.getRequests(curEvent._id);
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.deep.property('memberId', users[1]._id);
    });
  });

  describe('acceptRequest', function() {
    it('When request accepted, modify event.members', async function () {
      // Arrange
      const users = await createUsers(2);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      const eventId = curEvent._id;
      await eventService.requestToJoin(eventId, users[1]._id);

      // Act
      await eventService.acceptRequest(eventId, users[0]._id, users[1]._id);

      // Assert
      const result = await eventService.getMembers(curEvent._id);
      expect(result).to.have.lengthOf(2);
      expect(result[1]).to.have.deep.property('memberId', users[1]._id);
      const user = await userService.findUserById(null, users[1]._id, true);
      expect(user).to.have.deep.property('currentEvent', eventId);
    });

    it('When user is in other event, throw ALREADY_IN_OTHER_EVENT', async function () {
      // Arrange
      const users = await createUsers(2);
      const event0 = await eventService.createEvent(users[0]._id, 'test event');
      const event1 = await eventService.createEvent(users[1]._id, 'test event');
      await eventService.requestToJoin(event0._id, users[1]._id);

      // Act
      const prom = eventService.acceptRequest(event0._id, users[0]._id, users[1]._id);

      // Assert
      await expect(prom).to.eventually.be.rejected
          .and.eventually.be.equal(ALREADY_IN_OTHER_EVENT);
    });
  });

  describe('leaveEvent', function () {
    it('Pull event.member and unset currentEvent', async function () {
      // Arrange
      const users = await createUsers(2);
      const curEvent = await eventService.createEvent(users[0]._id, 'test event');
      const eventId = curEvent._id;

      // Act
      await eventService.leaveEvent(eventId, users[0]._id);
      
      // Assert
      const result = await eventService.getMembers(curEvent._id);
      expect(result).to.have.lengthOf(0);
      const user = await userService.findUserById(null, users[0]._id, true);
      expect(user.currentEvent).to.be.undefined;
    });
  });
});