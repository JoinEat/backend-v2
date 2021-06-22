const userService = require('../src/services/user');
const authService = require('../src/services/auth');
const {expect} = require('chai');

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
  });
});