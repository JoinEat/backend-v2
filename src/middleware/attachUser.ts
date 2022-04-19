const config = require('../config');
const jwt = require('jsonwebtoken');
const error = require('../errors');
import { Request, Response, NextFunction } from "express";
import { RequestWithUser } from "../interfaces/express_interface";

function getTokenFromHeader (req: Request) {
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
}

export default async function (req: RequestWithUser, res: Response, next: NextFunction) {
  const token = getTokenFromHeader(req);
  if (!token) return next();
  let userData;
  try {
    userData = jwt.verify(token, config.jwt.secret);
  } catch {
    return next(error.AUTH.AUTH_FAIL); // token invalid
  }
  req.user = userData.data;
  return next();
} 
