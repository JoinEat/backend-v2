const mongoose = require('mongoose');

const VerifyCodeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  code: {
    type: String,
    required: true,
  },
  createAt: {
    type: Date,
    default: Date.now(),
    expires: 600,
  },
});

const VerifyCodeModel = mongoose.model('VerifyCode', VerifyCodeSchema);
module.exports = VerifyCodeModel;
