const chai = require('chai')
var chaiAsPromised = require("chai-as-promised");
const userService = require('../src/services/user');
const friendService = require('../src/services/friend');
const authService = require('../src/services/auth');
const { USERID_NOT_VALID, USER_NOT_FOUND } = require('../src/errors/user');
const { createUsers } = require('./user.helper');

chai.use(chaiAsPromised);

const expect = chai.expect;

describe('User service', function() {
  describe('userIdExist', function () {
    it('When userId exists, return true', async function () {
      // Arrange
      const user = await authService.signUp('test1@gmail.com', 'weakpsswd', 'test1');
      userId = user._id;

      // Act
      const result = await userService.userIdExist(userId);

      // Assert
      expect(result).to.be.true;
    });

    it('When userId not exists, return false', async function () {
      // Arrange
      var userId = require('mongoose').Types.ObjectId();

      // Act
      const result = await userService.userIdExist(userId);

      // Assert
      expect(result).to.be.false;
    });

    it('When userId invalid, throw error', async function () {
      // Arrange
      var userId = 123;

      // Act
      const result = userService.userIdExist(userId);

      // Assert
      await expect(result).to.eventually.be.rejected
          .and.eventually.be.equal(USERID_NOT_VALID);
    });
  });

  describe('findUserById', function() {
    it('When userId exists, return the user', async function () {
      //Arrange
      const user = await authService.signUp('test1@gmail.com', 'weakpsswd', 'test1');
      const userId = user._id;

      // Act
      const result = await userService.findUserById(userId);

      // Assert
      expect(result).to.have.deep.property('_id', userId);
    });

    it('When userId not exists, throw USER_NOT_FOUND', async function () {
      //Arrange
      var userId = require('mongoose').Types.ObjectId();

      // Act
      const result = userService.findUserById(userId);

      // Assert
      await expect(result).to.eventually.be.rejected
          .and.eventually.be.equal(USER_NOT_FOUND);
    });

    it('When userId not valid, throw USERID_NOT_VALID', async function () {
      //Arrange
      var userId = "test";

      // Act
      const result = userService.findUserById(userId);

      // Assert
      await expect(result).to.eventually.be.rejected
          .and.eventually.be.equal(USERID_NOT_VALID);
    });
  });

  describe('updateUserById', function() {
    it('When userId exists and fields are valid, return the new user', async function () {
      //Arrange
      const user = await authService.signUp('test1@gmail.com', 'weakpsswd', 'test1');
      const userId = user._id;
      await userService.updateUserById(userId, {school: 'NTU'});

      // Act
      const result = await userService.updateUserById(userId, {school: 'NTHU', gender: 'Meow'});

      // Assert
      const data = {
        _id: userId,
        school: 'NTHU',
        gender: 'Meow',
      };
      expect(result).to.deep.include(data);
    });
    it('When userId exists and fields are immutable, throw immutable error');
    it('When userId exists and value has wrong type, throw value type error');;


    it('When userId not exists, throw USER_NOT_FOUND', async function () {
      //Arrange
      var userId = require('mongoose').Types.ObjectId();

      // Act
      const result = userService.updateUserById(userId, {});

      // Assert
      await expect(result).to.eventually.be.rejected
          .and.eventually.be.equal(USER_NOT_FOUND);
    });

    it('When userId not valid, throw USERID_NOT_VALID', async function () {
      //Arrange
      var userId = "test";

      // Act
      const result = userService.updateUserById(userId, {});

      // Assert
      await expect(result).to.eventually.be.rejected
          .and.eventually.be.deep.equal(USERID_NOT_VALID);
    });
  });

  describe('findUsers', function(){
    it('When filter is provided and valid, return filtered users', async function () {
      // Arrange
      users = await createUsers(3);
      await userService.updateUserById(users[0]._id, {
        gender: 'male',
        school: 'NTHU',
      });
      await userService.updateUserById(users[1]._id, {
        gender: 'female',
        school: 'NTHU',
      });
      await userService.updateUserById(users[2]._id, {
        gender: 'male',
        school: 'NTHU',
      });

      // Act
      result = await userService.findUsers({school: 'NTHU', gender: 'male'});

      // Assert
      expect(result).to.have.lengthOf(2);
    });

    it('When excludeFriendOfUser provided, exclude the users of its friend', async function() {
      // Arrange
      users = await createUsers(3);
      await friendService.requestFriend(users[0]._id, users[1]._id);

      // Act
      result = await userService.findUsers({}, users[1]._id);

      // Assert
      expect(result).to.have.lengthOf(2);
    });

    it('When nickNameSubstr provided, return filtered users', async function () {
      // Arrange
      users = await createUsers(3);
      await userService.updateUserById(users[0]._id, {
        nickName: 'xdoggy'
      });
      await userService.updateUserById(users[1]._id, {
        gender: 'catty',
      });
      await userService.updateUserById(users[2]._id, {
        gender: 'wong',
      });

      // Act
      result = await userService.findUsers({}, undefined, 'dog');

      // Assert
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.have.deep.property('_id', users[0]._id);
    });
  });
});