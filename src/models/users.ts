const mongoose = require('mongoose');
import { Schema, Types } from 'mongoose';

export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  realName?: string;
  nickName?: string;
  school?: string;
  gender?: string;
  department?: string;
  avatar?: string;
  verifyStatus: string;
  friends: IUser[];
  eventInvitation: any; // Event[]
  eventForm: any;
  currentEvent: any;
  public: boolean;

}
const userSchema = new Schema<IUser>(
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
      eventForm: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Event',
        },
      ],
      currentEvent: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Event',
        },
      ],
      public: {
        type: Boolean,
        default: true,
      },
});

const userModel = mongoose.model('User', userSchema);
export default userModel;