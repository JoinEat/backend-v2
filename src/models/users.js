const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
      name: {
        type: String,
        required: true,
        unique: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      password: {
        type: String,
        required: true,
      },
      realName: String,
      nickName: String,
      school: String,
      gender: String,
      department: String,
      avatar: String,
      verifyStatus: {
        type: String,
        default: 'none',
      },
      friends: [
        {
          friendId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
          },
          state: String, // requested, requesting, success
          updateAt: Date,
        },
      ],
      eventInvitations: [
        {
          eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Event',
          },
          updateAt: Date,
        },
      ],
      currentEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
      },
});

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;
