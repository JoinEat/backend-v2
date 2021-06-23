const chai = require('chai')
var chaiAsPromised = require("chai-as-promised");
const userService = require('../src/services/user');
const friendService = require('../src/services/friend');
const userHelper = require('./user.helper');
const User = require('../src/models/users');
const { NOT_REQUESTED_BY_TARGET } = require('../src/errors/friend');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('Friend service', function() {
  describe('requestFriend', function() {
    it('When both Id are valid and currently not friends, update friend list for both', async function () {
      // Arrange
      const userList = await userHelper.createUsers(2);
      const user1Id = userList[0]._id;
      const user2Id = userList[1]._id;

      // Act
      await friendService.requestFriend(user1Id, user2Id);

      // Assert
      const user1Friends = await friendService.findFriends(user1Id);
      const user2Friends = await friendService.findFriends(user2Id);

      expect(user1Friends).to.be.an('array').and.to.have.lengthOf(1);
      expect(user1Friends[0]).to.have.property('state', 'requesting')
      expect(user1Friends[0]).to.have.property('friendId');
      expect(user1Friends[0].friendId).to.have.deep.property('_id', user2Id);

      expect(user2Friends).to.be.an('array').and.to.have.lengthOf(1);
      expect(user2Friends[0]).to.have.property('state', 'requested')
      expect(user2Friends[0]).to.have.property('friendId');
      expect(user2Friends[0].friendId).to.have.deep.property('_id', user1Id);
    });

    it('When userId equal targetId, throw FRIEND_SELF_INVALID');
  });

  describe('findFriendById', function () {
    it('When both Id are valid and are friends, return the friend corresponding field', async function () {
      // Arrange
      const userList = await userHelper.createUsers(3);
      const user1Id = userList[0]._id;
      const user2Id = userList[1]._id;
      const user3Id = userList[2]._id;
      await friendService.requestFriend(user1Id, user3Id);

      // Act
      result = await friendService.findFriendById(user1Id, user3Id);

      // Assert
      const friendField = {
        friendId: user3Id,
        state: 'requesting',
      }
      expect(result).to.deep.include(friendField);
    });
  });

  describe('acceptFriendRequest', function() {
    it('When both Id are valid and requesting, change state to sucees for both user', async function() {
      // Arrange 
      const userList = await userHelper.createUsers(2);
      const user1Id = userList[0]._id;
      const user2Id = userList[1]._id;
      await friendService.requestFriend(user1Id, user2Id);

      // Act
      await friendService.acceptFriendRequest(user2Id, user1Id);
      const user1Friend = await friendService.findFriendById(user1Id, user2Id);
      const user2Friend = await friendService.findFriendById(user2Id, user1Id);

      // Assert
      const friend1Field = {
        friendId: user2Id,
        state: 'success',
      };
      const friend2Field = {
        friendId: user1Id,
        state: 'success',
      };
      expect(user1Friend).to.deep.include(friend1Field);
      expect(user2Friend).to.deep.include(friend2Field);
    });

    it('When both Id are valid and not requesting, throw NOT_REQUESTED_BY_TARGET', async function() {
      // Arrange 
      const userList = await userHelper.createUsers(2);
      const user1Id = userList[0]._id;
      const user2Id = userList[1]._id;

      // Act
      const result = friendService.acceptFriendRequest(user2Id, user1Id);

      // Assesrt
      await expect(result).to.eventually.be.rejected
          .and.eventually.be.deep.equal(NOT_REQUESTED_BY_TARGET);
    });
  });
});