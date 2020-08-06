const Joi = require('@hapi/joi');
const HttpStatus = require('http-status-codes');
const {
  handleError
} = require('../utils/utils');

exports.validate_create_question = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      title: Joi.string().required().label("Question title"),
      text: Joi.string().required().label("Question text"),
      tags: Joi.array().items(Joi.string()).required().label("Question Tags")
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}

exports.validate_answer_question = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      text: Joi.string().required().label("Question text"),
    })
    await schema.validate(req.body);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}

exports.validate_question_id_param = async (req, res, next) => {
  try {
    const schema = Joi.object().keys({
      id: Joi.string().required().label("Question ID")
    })
    await schema.validate(req.params);
    next()
  } catch (error) {
    return handleError(req, res, HttpStatus.PRECONDITION_FAILED, error.details, null)
  }
}
