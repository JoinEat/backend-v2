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
  location: {
    type: {type: String},
    coordinates: [Number],
  },
  members: [
    {
      memberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      state: String, // requested, inviting, success
      updateAt: Date,
    },
  ],
  messages: [
    {
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      text: String,
      createAt: Date,
    },
  ],
  public: {
    type: Boolean,
    default: true,
  },
});

EventSchema.pre('save', function(next) {
  now = new Date();
  this.updateAt = now;
  if (!this.createAt) this.createAt = now;
  next();
});

EventSchema.index({ "location" : "2dsphere" });
const EventModel = mongoose.model('Event', EventSchema);
module.exports = EventModel;
