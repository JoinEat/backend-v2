import { Error } from "mongoose";
import { IUser } from "../models/users";
const argon2 = require('argon2');
const User = require('../models/users');
const VerifyCode = require('../models/verifyCode');
const error = require('../errors');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userService = require('./user');
const mailService = require('./mail');

module.exports = {
  signUp,
  login,
  sendVerifyMail,
  verifyWithCode,
};

async function signUp (email: string | undefined, password: string | undefined, name: string | undefined) {
  if (!email || !password || !name) {
    throw error.GENERAL.VALIDATION_ERROR;
  }
  const hashedPassword = await argon2.hash(password);

  let user;
  try {
    user = await User.create({
      email,
      name,
      password: hashedPassword,
    });
  } catch (e: any ) {
    if (e.code == 11000) { // DUPLICATE KEY
      if (e.keyPattern.email == 1) {
        throw error.AUTH.EMAIL_DUPLICATE;
      } else {
        throw error.AUTH.NAME_DUPLICATE;
      }
    }
    throw e;
  }

  delete user.password;
  return user;
}

async function login (emailOrName: string, password: string) {
  let user;
  // find user with email first
  user = await User.findOne({email: emailOrName});
  // if failed try to find with name
  if (!user) user = await User.findOne({name: emailOrName});

  // if both failed throw error
  if (!user) throw error.AUTH.USER_NOT_EXISTS;

  const passwordMatched = await argon2.verify(user.password, password);
  if (!passwordMatched) throw error.AUTH.PASSWORD_INCORRECT;

  user = await User.findById(user._id).select('-password');
  return {
    user,
    token: generateToken(user),
  };
}

function generateToken (user: IUser) {
  const data = {
    _id: user._id,
    name: user.name,
    email: user.email,
  };

  const secret = config.jwt.secret;

  return jwt.sign({data}, secret, {});
}

async function sendVerifyMail (userId) {
  await userService.checkUserIdValidAndExist(userId);
  user = await userService.findUserById(null, userId);

  verifyCode = await generateCode(userId);

  await mailService.sendTextToEmailAddress(
      user.email,
      'Verify Email Address for When2Eat',
      `Hi ${user.name},\n\n`+
      'We just need to verify your email address before you can access When2Eat.\n\n' +
      `Verify your email address with code ${verifyCode.code}\n\n` +
      'Thanks! \n\n The When2Eat team'
  );

  await User.findOneAndUpdate(
    {_id: userId},
    {$set: {verifyStatus: 'pending'}},
    {new: true},
  );
}

async function generateCode(userId) {
  code = Math.floor(100000 + Math.random() * 900000).toString();

  verifyCode = new VerifyCode({
    user: userId,
    code
  });

  return verifyCode.save();
}

async function verifyWithCode (userId, code) {
  await userService.checkUserIdValidAndExist(userId);

  const verifyCode = await VerifyCode.findOne({user: userId, code}).exec();
  if (!verifyCode) throw error.AUTH.NO_SUCH_CODE;

  const user = await User.findOneAndUpdate(
    {_id: userId},
    {$set: {verifyStatus: 'success'}},
    {new: true},
  );

  return user;
}
