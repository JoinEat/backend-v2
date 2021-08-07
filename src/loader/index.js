const expressLoader = require('./express');
const mongooseLoader = require('./mongoose');
const socketLoader = require('./socket');

module.exports = async function ({app, io}) {
  await mongooseLoader();
  await expressLoader({app});
  await socketLoader({io});
}
