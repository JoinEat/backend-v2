const error = require('../errors');
const Event = require('../models/event');
const userService = require('./user');
const User = require('../models/users');
const { now } = require('mongoose');

const IMMUTABLE_FIELDS = ['creator', 'createAt'];

module.exports = {
  getEvents,
  getEventsSortByDistance,
  getEventById,
  createEvent,
  updateEvent,
  updateEventLocation,
  deleteEvent,
  checkEventIdValidAndExist,
  getInvitations,
  inviteToEvent,
  acceptInvitation,
  getRequests,
  requestToJoin,
  acceptRequest,
  getMembers,
  leaveEvent,
}

async function getEvents () {
  return Event.find({public: true}).exec();
}

async function getEventsSortByDistance (longitude, latitude) {
  return Event.find({
    location: {
      $near: {
        $geometry: {type: 'Point', coordinates: [longitude, latitude]},
      },
    },
  })
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

async function getEventById (eventId, userId) {
  await checkEventIdValidAndExist(eventId);

  result = await Event.findById(eventId);
  status = userId ? await getMemberStatus(eventId, userId) : 'none';
  if (!result.public && status != 'success') {
    throw error.Event.NO_PERMISSION;
  }

  return result;
}

async function createEvent (userId, title) {
  await userService.checkUserIdValidAndExist(userId);
  
  newEvent = new Event({title, creator: userId});
  resEvent = await newEvent.save();

  await addMemberWithStatus(resEvent._id, userId, 'success');
  resEvent = await Event.findById(resEvent._id);

  await User.findOneAndUpdate(
    {_id: userId},
    {$push: {currentEvent: resEvent._id}},
  );
  return resEvent;
}

// TODO: check user permission
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

async function updateEventLocation (eventId, userId, longitude, latitude) {
  await checkEventIdValidAndExist(eventId);
  await userService.checkUserIdValidAndExist(userId);
  await checkPermission(eventId, userId);

  longitude = parseFloat(longitude);
  latitude = parseFloat(latitude);

  const updatedEvent = await Event.findOneAndUpdate(
    {_id: eventId},
    {$set: {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      }
    } },
    {new: true}
  );

  return updatedEvent;
}

async function deleteEvent (eventId) {
  await checkEventIdValidAndExist(eventId);

  await Event.findOneAndDelete({_id: eventId}).exec();
}

async function updateMemberStatus (eventId, userId, status) {
  await Event.findOneAndUpdate(
      {
        _id: eventId,
        members: {$elemMatch: {memberId: userId}},
      },
      {$set: {
        'members.$.state': status,
        'members.$.updateAt': now(),
      }},
  ).exec();
}

async function addMemberWithStatus (eventId, userId, status) {
  await Event.findOneAndUpdate(
      {_id: eventId},
      {
        $push: {
          members: {
            memberId: userId,
            state: status,
            updateAt: now(),
          },
        },
      }
  );
}

/**
 * Return the status of a user in an event.
 * @param {*} eventId 
 * @param {*} userId 
 * @returns {Promise} "success", "inviting", "requested", "none"
 */
async function getMemberStatus (eventId, userId) {
  const currentEvent = await Event.findById(eventId, {
    members: {$elemMatch: {memberId: userId}},
  });
  if (currentEvent.members.length) {
    return currentEvent.members[0].state;
  }
  return 'none';
}

async function checkPermission (eventId, userId) {
  const currentEvent = await Event.findById(eventId);
  const creatorId = String(currentEvent.creator);
  const userIdStr = String(userId);

  if (userIdStr != creatorId) {
    throw error.EVENT.NO_PERMISSION;
  }
}

async function checkNotMember (eventId, userId) {
  status = await getMemberStatus(eventId, userId);
  if (status == 'success') throw error.EVENT.ALREADY_MEMBER;
  if (status == 'inviting') throw error.EVENT.ALREADY_INVITING;
  if (status == 'requested') throw error.EVENT.ALREADY_REQUESTED;
}

async function checkNoCurrentEvent (userId) {
  const user = await userService.findUserById(null, userId, true);
  if (user.currentEvent) throw error.EVENT.ALREADY_IN_OTHER_EVENT;
}

async function getMemberWithStatus (eventId, status) {
  const currentEvent = await Event.findById(eventId);
  result = []
  for (member of currentEvent.members) {
    if (member.state == status) result.push(member);
  }
  return result;
}

async function getInvitations (eventId) {
  return getMemberWithStatus(eventId, 'inviting');
}

async function getRequests (eventId) {
  return getMemberWithStatus(eventId, 'requested');
}

async function getMembers (eventId) {
  return getMemberWithStatus(eventId, 'success');
}

async function inviteToEvent (eventId, userId, targetId) {
  await userService.checkUserIdValidAndExist(userId);
  await userService.checkUserIdValidAndExist(targetId);
  await checkEventIdValidAndExist(eventId);
  await checkPermission(eventId, userId);
  await checkNotMember(eventId, targetId);
  
  const currentTime = now();
  await addMemberWithStatus(eventId, targetId, 'inviting');
  await User.findOneAndUpdate(
    {_id: targetId},
    {
      $push: {
        eventInvitations: {
          eventId: eventId,
          updateAt: currentTime,
        },
      },
    },
  );
}

async function acceptInvitation (eventId, userId) {
  await userService.checkUserIdValidAndExist(userId);
  await checkEventIdValidAndExist(eventId);
  const status = await getMemberStatus(eventId, userId);
  if (status != 'inviting') throw error.EVENT.NOT_INVITING;

  await User.findOneAndUpdate(
    {_id: userId},
    {
      $pull: {eventInvitations: {eventId: eventId}},
      $push: {currentEvent: eventId},
    },
  );
  await updateMemberStatus(eventId, userId, "success");
}

async function checkPublic (eventId) {
  const cur = await Event.findById(eventId);
  if (!cur.public) {
    throw error.EVENT.NO_PERMISSION;
  }
}

async function requestToJoin (eventId, userId) {
  await userService.checkUserIdValidAndExist(userId);
  await checkEventIdValidAndExist(eventId);
  await checkPublic(eventId);
  await checkNotMember(eventId, userId);

  await addMemberWithStatus(eventId, userId, 'requested');
}

async function acceptRequest (eventId, userId, targetId) {
  await userService.checkUserIdValidAndExist(userId);
  await userService.checkUserIdValidAndExist(targetId);
  await checkEventIdValidAndExist(eventId);
  await checkPermission(eventId, userId);
  const status = await getMemberStatus(eventId, targetId);
  if (status != 'requested') throw error.EVENT.NOT_REQUESTED;

  await updateMemberStatus(eventId, targetId, 'success');
  await User.findOneAndUpdate(
    {_id: targetId},
    {$push: {currentEvent: eventId}},
  );
}

async function leaveEvent (eventId, userId) {
  await userService.checkUserIdValidAndExist(userId);
  await checkEventIdValidAndExist(eventId);
  const status = await getMemberStatus(eventId, userId);
  if (status != 'success') throw error.EVENT.NOT_MEMBER;

  await User.findOneAndUpdate(
    {_id: userId},
    {$pull: {currentEvent: eventId}},
  );
  await Event.findOneAndUpdate(
    {_id: eventId},
    {$pull: {members: {memberId: userId}}},
  );
}