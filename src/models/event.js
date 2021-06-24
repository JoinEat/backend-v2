const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  createAt: Date,
  updateAt: Date,
  startAt: Date,
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  position: String,
  latitude: Number,
  longitude: Number,
});

EventSchema.pre('save', function(next) {
  now = new Date();
  this.updateAt = now;
  if (!this.createAt) this.createAt = now;
  next();
});

const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;
