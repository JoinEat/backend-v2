const dbHandler = require('./db-handler');

before('Connect database', async function(){
  await dbHandler.connect();
});

afterEach('Clear database', async function(){
  await dbHandler.clearDatabase();
});

after('Close database', async function(){
  await dbHandler.closeDatabase();
});