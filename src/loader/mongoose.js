const mongoose = require('mongoose');
const config = require('../config');

module.exports = async function () {
  return mongoose.connect(config.db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  });
}
