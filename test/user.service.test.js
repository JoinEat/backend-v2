const chai = require('chai')
var chaiAsPromised = require("chai-as-promised");
const userService = require('../src/services/user');
const authService = require('../src/services/auth');
const { USERID_NOT_VALID, USER_NOT_FOUND } = require('../src/errors/user');

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
});