const UserModel = require('../models/user.model');
const HttpStatus = require('http-status-codes');
const { getAsync, client } = require('../utils/redis');
const {
  handleError, handleSuccess
} = require('../utils/utils');
const publisher = require('../utils/rabbitmq');

const UserController = {

  /**
   * Get Users.
   * @description This returns all users in the Premier League Ecosystem.
   * @return {object[]} users
   */
  async all(req, res, next) {
    try {
      let users = {}
      const result = await getAsync('stackoverflow__users');
      // console.log(result)
      if (result != null && JSON.parse(result).length > 0) {
        users = JSON.parse(result);
      } else {
        users = await UserModel.find({}, { password: 0, recover_token: 0, token: 0 });
        for (let index = 0; index < users.length; index++) {
          users[users[index]._id] = users[index]
        }
        await client.set('stackoverflow__users', JSON.stringify(users));
      }
      return handleSuccess(req, res, HttpStatus.OK, 'Users retrieved', users)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Could not get users', error)
    }
  },

  /**
     * Get User
     * @description This gets a user from the STTP Ecosystem based off ID
     * @param   {string}  id  User's ID
     * @return  {object}  user
     */
  async one(req, res, next) {
    try {
      const _id = req.params.id;
      const user = await UserModel.findById(_id);

      if (user) {
        return handleSuccess(req, res, HttpStatus.OK, 'User retrieved', user)
      }
      return handleError(req, res, HttpStatus.NOT_FOUND,  'User not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error getting user', error)
    }
  },

  /**
   * Update User
   * @description This returns the transactions on all wallets of a user
   * @param {string} username     Username
   * @return {object} user
   */
  async update(req, res, next) {
    try {
      const _id = req.params.id;
      delete req.body.password
      delete req.body.token
      delete req.body.recover_token
      const user = await UserModel.findByIdAndUpdate(
        _id,
        { $set: req.body },
        { safe: true, multi: true, new: true }
      )
      if (user) {
        const newUser = UserController.deepCopy(user)
        await Promise.all([publisher.queue('ADD_OR_UPDATE_USER_PREMIER_CACHE', { newUser })])
        return handleSuccess(req, res, HttpStatus.OK, 'User has been updated', newUser)
      }
      return handleError(req, res, HttpStatus.NOT_FOUND, 'User not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error updating user', error)
    }
  },

  /**
     * Change User Password
     * @description Change a user's profile password
     * @return {object} user
     */
    async changePass(req, res, next) {
      try {
        const userId = req.jwtUser
        const user = await UserModel.findById(userId);
        if (!user) { return handleError(req, res, HttpStatus.NOT_FOUND, 'User not found here', null) }
        user.password = user.encrypt(req.body.password);
  
        const newUser = deepCopy(user)
        await Promise.all([user.save()])
  
        return handleSuccess(req, res, HttpStatus.OK, 'Password changed successfully', newUser)
      } catch (error) {
        return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error changing password', error)
      }
    },

  /**
   * Redis Cache User
   * @description Add or Update redis user caching
   * @param user User object
   */
  async addOrUpdateCache(object, key) {
    try {
      // console.log(user)
      const premierObject = await getAsync(key);
      if (premierObject != null && JSON.parse(premierObject).length > 0) {
        const objects = JSON.parse(premierObject);
        objects[object._id] = object
        await client.set(key, JSON.stringify(objects));
      }
    } catch (err) {
      console.log(err)
    }
  },

  /**
   * Deep Copy
   * @description copy mongo object into a user object
   * @param user User object
   */
  deepCopy(user) {
    try {
      let newUser = JSON.stringify(user)
      newUser = JSON.parse(newUser)
      delete newUser.password;
      return newUser;
    } catch (err) {
      console.log(err)
    }
  }
};

module.exports = UserController;
