const authService = require('../src/services/auth')

module.exports = {
  createUsers,
}

async function createUsers (count = 3) {
  userList = []
  for (i=0; i<count; i++) {
    userName = `user${i}`;
    userEmail = `user${i}@gmail.com`;
    userPassword = `'a;,oq.ej`;

    user = await authService.signUp(userEmail, userPassword, userName);
    userList.push(user);
  }
  return userList;
}