const mongoose = require('mongoose');

const EventSendFormSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  scheduleAt: {
    type: Date,
  },
});

const EventSendFormModel = mongoose.model('EventSendForm', EventSendFormSchema);
module.exports = EventSendFormModel;
