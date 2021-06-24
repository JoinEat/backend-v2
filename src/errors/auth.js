module.exports = {
  NAME_DUPLICATE: {
    statusCode: 400,
    message: 'NAME_EXISTS'
  },
  EMAIL_DUPLICATE: {
    statusCode: 400,
    message: 'EMAIL_EXISTS'
  },
  USER_NOT_EXISTS: {
    statusCode: 401,
    message: 'USER_NOT_EXISTS',
  },
  PASSWORD_INCORRECT: {
    statusCode: 401,
    message: 'PASSWORD_INCORRECT',
  },
  AUTH_FAIL: {
    statusCode: 401,
    message: 'AUTH_FAIL',
  },
  NO_SUCH_CODE: {
    statusCode: 401,
    message: 'NO_SUCH_CODE',
  },
}
