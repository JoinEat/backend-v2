const expressLoader = require('./express');
const mongooseLoader = require('./mongoose');
const socketLoader = require('./socket');
const squadEvents = require('./squadEvents');

module.exports = async function ({app, io}) {
  await mongooseLoader();
  await expressLoader({app});
  await socketLoader({io});
  await squadEvents();
}
