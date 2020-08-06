const Joi = require('@hapi/joi');
const HttpStatus = require('http-status-codes');
const {
  handleError
} = require('../utils/utils');

exports.validate_change_pass = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      password: Joi.string().required().label("Password")
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}

exports.validate_user_id_param = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      id: Joi.string().required().label("User ID")
    })
    await schema.validate(req.params);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}
