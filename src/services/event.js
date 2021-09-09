const error = require('../errors');
const Event = require('../models/event');
const SquadEvent = require('../models/squadEvents');
const userService = require('./user');
const friendService = require('./friend');
const User = require('../models/users');
const { now } = require('mongoose');
const {PUBLIC_FIELDS} = require('./user');
const config = require('../config');

const IMMUTABLE_FIELDS = ['creator', 'createAt'];
const MUTABLE_FIELDS = ['title', 'startAt', 'position', 'public'];
const PUBLIC_FIELDS_SELECT = PUBLIC_FIELDS.join(' ');

module.exports = {
  getEvents,
  getEventsSortByDistance,
  getEventById,
  createEvent,
  updateEvent,
  updateEventLocation,
  deleteEvent,
  destroyEvent,
  checkEventIdValidAndExist,
  getInvitations,
  inviteToEvent,
  acceptInvitation,
  getRequests,
  requestToJoin,
  acceptRequest,
  getMembers,
  leaveEvent,
  getEventMessages,
  createEventMessage,
}

async function createSquadEvent (eventName, eventId, schedule) {
  const date = new Date(parseInt(schedule));
  console.log(schedule, date);
  const newEvent = new SquadEvent({
    event: eventId,
    type: 'destroy',
    scheduleAt: date,
  });
  await newEvent.save();
}

/**
 * get all events
 * @returns all the public events
 */
async function getEvents (query, userId) {
  filter = {public: true};

  if (query.friendCreator == 'true') {
    friends = await friendService.findFriends(userId, 'success');
    friendsId = friends.map(user => user.friendId._id);
    filter.creator = {$in: friendsId};
  }

  if (query.position) {
    filter.position = query.position;
  }

  return Event.find(filter).exec();
}

/**
 * Sort Event by Distance
 * @param longitude 
 * @param latitude 
 * @returns list of events
 */
async function getEventsSortByDistance (longitude, latitude) {
  return Event.find({
    location: {
      $near: {
        $geometry: {type: 'Point', coordinates: [longitude, latitude]},
      },
    },
  })
}

/**
 * Check if eventId exist
 * @param eventId 
 * @returns Boolean
 */
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

/**
 * Throw error if eventId not valid or not exist
 * @param eventId 
 */
async function checkEventIdValidAndExist (eventId) {
  if (!await eventIdExist(eventId)) throw error.EVENT.EVENT_NOT_FOUND;
}

/**
 * Get event if it is public or the user has permission
 * @param eventId 
 * @param userId 
 * @returns the event with detail
 */
async function getEventById (eventId, userId) {
  await checkEventIdValidAndExist(eventId);

  result = await Event.findById(eventId);
  status = userId ? await getMemberStatus(eventId, userId) : 'none';

  if (!result.public && status == 'none') {
    throw error.EVENT.NO_PERMISSION;
  }

  return result;
}

/**
 * Create an event with title by userId
 * @param userId 
 * @param title 
 * @returns new event
 */
async function createEvent (userId, title, data) {
  await userService.checkUserIdValidAndExist(userId);
  if (!title) throw error.EVENT.TITLE_REQUIRED;
  
  const newEvent = new Event({title, creator: userId});
  let resEvent = await newEvent.save();

  await addMemberWithStatus(resEvent._id, userId, 'success');
  resEvent = await Event.findById(resEvent._id);

  await User.findOneAndUpdate(
    {_id: userId},
    {$push: {currentEvent: resEvent._id}},
  );
  await createSquadEvent('destroy', resEvent._id, Date.now() + parseInt(config.squad.emptyLife));

  if (data) resEvent = await updateEvent(resEvent._id, userId, data)
  return resEvent;
}

/**
 * Update eventId if userId have permission
 * @param eventId 
 * @param userId 
 * @param data 
 * @returns updated event
 */
async function updateEvent (eventId, userId, data) {
  await checkEventIdValidAndExist(eventId);
  await userService.checkUserIdValidAndExist(userId);
  await checkPermission(eventId, userId);

  if (data.longitude || data.latitude) {
    if (!(data.longitude && data.latitude)) throw error.EVENT.LONGITUDE_OR_LATITUDE_MISSING;
    await updateEventLocation(eventId, userId, data.longitude, data.latitude);
    delete data.longitude;
    delete data.latitude;
  }

  for (key in data) {
    if (!MUTABLE_FIELDS.includes(key)) {
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

/**
 * Update eventId location if userId have permission
 * @param eventId 
 * @param userId 
 * @param longitude 
 * @param latitude 
 * @returns updated event
 */
async function updateEventLocation (eventId, userId, longitude, latitude) {
  await checkEventIdValidAndExist(eventId);
  await userService.checkUserIdValidAndExist(userId);
  await checkPermission(eventId, userId);

  longitude = parseFloat(longitude);
  latitude = parseFloat(latitude);
  if (!longitude || !latitude) throw error.EVENT.GEO_LOCATION_NOT_VALID;

  let updatedEvent;
  try {
    updatedEvent = await Event.findOneAndUpdate(
      {_id: eventId},
      {$set: {
        location: {
          type: 'Point',
          coordinates: [longitude, latitude],
        }
      } },
      {new: true}
    );
  } catch (e) {
    if (e.code == 16755) throw error.EVENT.GEO_LOCATION_NOT_VALID;
    throw e;
  }
  
  return updatedEvent;
}

/**
 * Delete event and remove all members
 * @param eventId 
 * @param userId 
 */
async function deleteEvent (eventId, userId) {
  await checkEventIdValidAndExist(eventId);
  await userService.checkUserIdValidAndExist(userId);
  await checkPermission(eventId, userId);
  // TODO: remove all member

  await destroyEvent(eventId);
  // await Event.findOneAndDelete({_id: eventId}).exec();
}

async function destroyEvent (eventId) {
  const squad = await Event.findById(eventId);
  for (const member of squad.members) {
    console.log('remove', member);
    if (member.state == 'inviting') {
      await User.findOneAndUpdate(
          {_id: member.memberId},
          {$pull: {eventInvitations: {eventId}}},
      );
    }
    if (member.state == 'success') {
      console.log('remove', member.memberId, eventId);
      await User.findOneAndUpdate(
          {_id: member.memberId},
          {$pull: {currentEvent: eventId}},
      );
    }
  }

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
  const public_select = PUBLIC_FIELDS.join(' ');
  const currentEvent = await Event.findById(eventId).populate('members.memberId', public_select);
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

async function getEventMessages (eventId, userId, nextKey) {
  await userService.checkUserIdValidAndExist(userId);
  await checkEventIdValidAndExist(eventId);
  const status = await getMemberStatus(eventId, userId);
  if (status != 'success') throw error.EVENT.NOT_MEMBER;

  const squad = await Event.findById(eventId, {
    messages: 1,
  }).populate('messages.author', PUBLIC_FIELDS_SELECT);

  return squad.messages.filter((message) => nextKey ? message._id > nextKey : true);
}

async function createEventMessage (eventId, userId, text) {
  await userService.checkUserIdValidAndExist(userId);
  await checkEventIdValidAndExist(eventId);
  const status = await getMemberStatus(eventId, userId);
  if (status != 'success') throw error.EVENT.NOT_MEMBER;
  if (!text) throw error.EVENT.TEXT_EMPTY;

  const new_message = {
    author: userId,
    text,
    createAt: now()
  };

  await Event.findOneAndUpdate(
      {_id: eventId},
      {$push: {messages: new_message}},
  );
}