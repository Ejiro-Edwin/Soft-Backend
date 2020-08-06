// const jwt = require('jsonwebtoken');
const randomstring = require('randomstring');
const UserModel = require('../models/user.model');
const {
  createJWT, config, handleError, handleSuccess, generateRandomNumbers
} = require('../utils/utils');
const HttpStatus = require('http-status-codes');
const { deepCopy } = require('../controllers/user');
const publisher = require('../utils/rabbitmq');

const AuthController = {
  /**
   * Create User
   * @description Create a user
   * @param {string} username        Username
   * @param {string} email           email
   * @param {string} password        Password
   * @return {object} user
   */
  async register(req, res, next) {
    try {
      console.log("get to register here: %o", req.body)
      const userFound = await UserModel.findOne({ email: req.body.email })
      if (userFound) { return handleError(req, res, HttpStatus.BAD_REQUEST, 'this email is already registered with us', null) }

      const usernameFound = await UserModel.findOne({ username: req.body.username })
      if (usernameFound) { return handleError(req, res, HttpStatus.BAD_REQUEST, 'username already exists', null) }

      const user = new UserModel({
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        identifier: generateRandomNumbers(7)
      })

      const jwtToken = createJWT(user.email, user._id);
      user.token = jwtToken;

      const newUser = deepCopy(user)
      console.log('new user: %o',newUser)

      await Promise.all([user.save(), publisher.queue('ADD_OR_UPDATE_USER_STACKOVERFLOW_CACHE', { newUser }), publisher.queue('SEND_USER_STACKOVERFLOW_SIGNUP_EMAIL', { user })])
      return handleSuccess(req, res, HttpStatus.CREATED, 'User created successfully', newUser)
    } catch (error) {
      handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Could not create user', error)
    }
  },

  /**
   * User Login
   * @description Login a user
   * @param {string} email
   * @param {string} password
   * @return {object} user
   */
  async login(req, res, next) {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const user = await UserModel.findOne({ email }).select('+password');
      if (!user) { return handleError(req, res, HttpStatus.NOT_FOUND, 'User not found here', null) }

      if (!user.validatePassword(password)) {
        return handleError(req, res, HttpStatus.UNAUTHORIZED, 'Wrong password', null)
      }
      
      const jwtToken = createJWT(email, user._id)
      user.token = jwtToken;
      const newUser = deepCopy(user)

      await Promise.all([user.save(), publisher.queue('ADD_OR_UPDATE_USER_STACKOVERFLOW_CACHE', { newUser })])
      return handleSuccess(req, res, HttpStatus.OK, 'User signed in', newUser)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Could not login user', error)
    }
  },

  /**
     * User Send Token
     * @description Send a forgot password token to a user
     * @param {string} email
     * @return {null}
     */
  async sendToken(req, res, next) {
    try {
      const email = req.body.email;
      const user = await UserModel.findOne({ email });
      if (!user) { return handleError(req, res, HttpStatus.NOT_FOUND, 'User not found here', null) }

      const token = randomstring.generate({
        length: 5,
        charset: 'numeric'
      });
      user.recover_token = user.encrypt(token);

      await Promise.all([user.save(), publisher.queue('SEND_USER_STACKOVERFLOW_TOKEN_EMAIL', { user, token })])
      return handleSuccess(req, res, HttpStatus.OK, 'Token sent', token)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error getting user', error)
    }
  },

  /**
     * Reset User Password
     * @description Resets a user password
     * @param {string} email
     * @param {string} password
     * @param {string} token
     * @return {object} user
     */
  async resetPass(req, res, next) {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const token = req.body.token;

      const user = await UserModel.findOne({email}).select('+recover_token');
      if (!user) { return handleError(req, res, HttpStatus.NOT_FOUND, 'User not found here', null) }
      if (!user.validateToken(token)) { return handleError(req, res, HttpStatus.UNAUTHORIZED, 'Wrong Token', null)}

      const jwtToken = createJWT(email, user._id, user.type);
      user.password = user.encrypt(password);
      user.token = jwtToken;

      const newUser = deepCopy(user)
      await Promise.all([user.save(), publisher.queue('ADD_OR_UPDATE_USER_PREMIER_CACHE', { newUser })])
      return handleSuccess(req, res, HttpStatus.OK, 'Password reset', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error reseting password', error)
    }
  },

};

module.exports = AuthController;
