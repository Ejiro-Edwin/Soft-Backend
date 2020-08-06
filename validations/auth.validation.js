const Joi = require('@hapi/joi');
const HttpStatus = require('http-status-codes');
const {
  handleError
} = require('../utils/utils');

exports.validate_signup = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      username: Joi.string().required().label("Username"),
      email: Joi.string().required().label("Email"),
      password: Joi.string().required().label("Password"),
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    console.log(error)
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}

exports.validate_login = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().required().label("Email"),
      password: Joi.string().required().label("Password"),
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}

exports.validate_send_token = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().required().label("Email"),
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}

exports.validate_reset_token = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      email: Joi.string().required().label("Email"),
      password: Joi.string().required().label("Password"),
      token: Joi.number().required().label("Recovery Token"),
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}