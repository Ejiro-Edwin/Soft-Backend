const express = require('express');
const AuthController = require('../controllers/auth')
const QuestionController = require('../controllers/question')
const UserController = require('../controllers/user')
const { isUser } = require('../utils/middleware')
const { validate_login, validate_signup, validate_send_token, validate_reset_token } = require('../validations/auth.validation')
const { validate_change_pass, validate_user_id_param } = require('../validations/user.validation')
const { validate_create_question, validate_question_id_param, validate_answer_question } = require('../validations/question.validation')

const router = express.Router();

/**
 * Auth Routes
 */
router.post('/user/register', validate_signup, AuthController.register);
router.post('/user/login', validate_login, AuthController.login);
router.post('/user/send-token', validate_send_token, AuthController.sendToken);
router.patch('/user/reset-pass', validate_reset_token, AuthController.resetPass);

/** 
 * User Routes
 */
router.get('/user', UserController.all);
router.get('/user/:id', validate_user_id_param, UserController.one);
router.patch('/user/:id', validate_user_id_param, isUser, UserController.update);
router.patch('/user/change-pass', isUser, validate_change_pass, UserController.changePass);

router.get('/question', QuestionController.all);
router.get('/question/:id', validate_question_id_param, QuestionController.one);
router.post('/question', isUser, validate_create_question, QuestionController.create);
router.post('/question/:id/subscribe', isUser, validate_question_id_param, QuestionController.subscribe);
router.post('/question/:id/answer', isUser, validate_question_id_param, validate_answer_question, QuestionController.answer);
router.patch('/question/:id/upvote', isUser, validate_question_id_param, QuestionController.upvote);
router.patch('/question/:id/downvote', isUser, validate_question_id_param, QuestionController.downvote);
router.patch('/question/:id', isUser, validate_question_id_param, QuestionController.update);

/**
 * Search Route
 */
router.get('/search', QuestionController.search);
module.exports = router;
