const mongoose = require('mongoose');

const SquadEventSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  type: {
    type: String,
  },
  scheduleAt: {
    type: Date,
  },
});

const SquadEventModel = mongoose.model('SquadEvent', SquadEventSchema);
module.exports = SquadEventModel;
