// Import lbraries
const UserModel = require('../models/user.model');
const HttpStatus = require('http-status-codes')
const {
  checkToken, handleError
} = require('./utils');
const logger = require('./logger')

/**
 * Check Query originates from resource with at user rights
 */
exports.isUser = async (req, res, next) => {
  try {
    const token = await checkToken(req);
    if (token.status === 'failed') {
      return handleError(req, res, HttpStatus.UNAUTHORIZED, token.message)
    }
    if (token.data.type === Object.values(UserModel.UserType)[0] ||
      token.data.type === Object.values(UserModel.UserType)[1] ||
      token.data.type === Object.values(UserModel.UserType)[2]
    ) {
      req.jwtUser = token.data
      next()
    } else {
      return handleError(req, res, HttpStatus.UNAUTHORIZED, 'Access not granted to this resource.', null)
    }
  } catch (err) {
    return handleError(req, res, HttpStatus.BAD_REQUEST, 'Failed to authenticate token.', null)
  }
}

/**
 * Check Query originates from resource with  company or admin rights
 */
exports.isAdmin = async (req, res, next) => {
  try {
    const token = await checkToken(req);
    if (token.status === 'failed') {
      return handleError(req, res, HttpStatus.UNAUTHORIZED, token.message)
    }
    if (token.data.type === Object.values(UserModel.UserType)[1] ||
      token.data.type === Object.values(UserModel.UserType)[2]
    ) {
      req.jwtUser = token.data
      next()
    } else {
      return handleError(req, res, HttpStatus.UNAUTHORIZED, 'Access not granted to this resource.', null)
    }
  } catch (err) {
    return handleError(req, res, HttpStatus.BAD_REQUEST, 'Failed to authenticate token.', null)
  }
}

/**
 * Express Middleware that logs incoming HTTP requests.
 */
exports.logRequest = (req, res, next) => {
  logger.logAPIRequest(req);
  next();
};
