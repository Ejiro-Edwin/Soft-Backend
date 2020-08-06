const QuestionModel = require('../models/question.model');
const AnswerModel = require('../models/answer.model');
const SubscribeModel = require('../models/subscription.model');
const UserModel = require('../models/user.model');
const HttpStatus = require('http-status-codes');
const {
  handleError, handleSuccess, config
} = require('../utils/utils');
const publisher = require('../utils/rabbitmq');

const QuestionController = {
  /**
   * Create Question
   * @description Create a stackoverflow question
   * @param {string} user 
   * @param {string} text      
   * @param {Array} tags
   * @return {object} question
   */
  async create(req, res, next) {
    try {
      const {title, text, tags} = req.body

      let question = new QuestionModel({
        user: req.jwtUser._id,
        title,
        text,
        tags
      })

      question = await question.save()
      return handleSuccess(req, res, HttpStatus.CREATED, 'Question created successfully', question)
    } catch (error) {
      handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Could not create team', error)
    }
  },
  /**
     * Get all Questions
     * @description This returns questions in the stackoverflow Ecosystem.
     * @param   {string}  from  From Date
     * @param   {string}  to  To Date
     * @param   {string}  page  Pagination
     * @param   {string}  count  Number of fixtures per page
     * @param   {string}  text  Pending, Completed, Ongoing
     * @return  {object}  questions
     */
    all: async (req, res) => {
      try {
        let { page, count } = req.query
        const {
          from, to, text
        } = req.query
    
        page = parseInt(page, 10)
        count = parseInt(count, 10)
    
        page = req.query.page == null || page <= 0 ? 1 : page
        count = req.query.count == null || count <= 0 ? 50 : count
    
        const query = {}
        if (text) query.title = `/${text}/`
    
        if (from && to == null) query.createdAt = { $gte: from }
        if (to && from == null) query.createdAt = { $lt: to }
        if (from && to) query.createdAt = { $lt: to, $gte: from }
    
        const all = await Promise.all([
          QuestionModel.find(query).populate('user')
            .skip((page - 1) * count)
            .limit(count)
            .sort({ createdAt: -1 }),
            QuestionModel.estimatedDocumentCount(query)
        ])
    
        const questions = all[0]
        const questionsCount = all[1]
        const meta = {
          page,
          perPage: count,
          total: questionsCount,
          pageCount: Math.ceil(questionsCount / count)
        }
        return handleSuccess(req, res, HttpStatus.OK, 'Questions retrieved', {questions, meta})
      } catch (error) {
        return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, error)
      }
    },

    /**
     * Search
     * @description This returns questions in the stackoverflow Ecosystem, depending on search parameters.
     * @param   {string}  from  From Date
     * @param   {string}  to  To Date
     * @param   {string}  page  Pagination
     * @param   {string}  count  Number of fixtures per page
     * @param   {string}  text  Pending, Completed, Ongoing
     * @return  {object}  questions
     */
    search: async (req, res) => {
      try {
        let { page, count, search} = req.query
        let result = {}
        page = parseInt(page, 10)
        count = parseInt(count, 10)
    
        page = req.query.page == null || page <= 0 ? 1 : page
        count = req.query.count == null || count <= 0 ? 50 : count

        if(search.includes('user:')){
          // identifier
          const identifier = search.replace('user:', '')
          const user = await UserModel.findOne({identifier: identifier})
          if(!user) return handleSuccess(req, res, HttpStatus.OK, 'Saerch successful', [])
          const all = await Promise.all([
            QuestionModel.find({user: user._id}).populate('user')
              // .skip((page - 1) * count)
              // .limit(count)
              .sort({ createdAt: -1 }),
            AnswerModel.find({user: user._id}).populate('user').populate('question')
              // .skip((page - 1) * count)
              // .limit(count)
              .sort({ createdAt: -1 })
          ])
      
          const questions = all[0]
          const answers = all[1]
          result = questions.concat(answers)
        } else {
          const all = await Promise.all([
            QuestionModel.find({$or: [{title: { $regex: search, $options: 'i' }}, {text: { $regex: search, $options: 'i' }}]}).populate('user')
              // .skip((page - 1) * count)
              // .limit(count)
              .sort({ createdAt: -1 }),
            AnswerModel.find({text: { $regex: `${search}`, $options: 'i' }}).populate('user').populate('question')
              // .skip((page - 1) * count)
              // .limit(count)
              .sort({ createdAt: -1 })
          ])
      
          const questions = all[0]
          const answers = all[1]
          result = questions.concat(answers)
        }
        return handleSuccess(req, res, HttpStatus.OK, 'Saerch successful', result)
      } catch (error) {
        return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, error)
      }
    },

  /**
     * Get Question
     * @description This returns a question's details.
     * @param   {string}  id  Question ID
     * @return  {object}  question
     */
  async one(req, res, next) {
    try {
      const _id = req.params.id;
      const [ question, answers ] = await Promise.all([QuestionModel.findById(_id).populate('user'), AnswerModel.find({question: _id}).populate('user')]);
      if (question) {
        return handleSuccess(req, res, HttpStatus.OK, 'Question retrieved successfully', {question, answers})
      }
      return handleError(req, res, HttpStatus.NOT_FOUND,  'Question not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error getting question', error)
    }
  },

  /**
   * Upvote Question
   * @description This updates a Question
   * @param   {string}  id  Question's ID
   * @return {object} Question
   */
  async upvote(req, res, next) {
    try {
      const _id = req.params.id;
      const question = await QuestionModel.findByIdAndUpdate(
        _id,
        {$inc: { votes: 1 } },
        { safe: true, multi: true, new: true }
      )
      if (question) {
        return handleSuccess(req, res, HttpStatus.OK, 'Question has been upvoted', question)
      }
      return handleError(req, res, HttpStatus.NOT_FOUND, 'Question not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error upvoting question', error)
    }
  },

  /**
   * Upvote Question
   * @description This updates a Question
   * @param   {string}  id  Question's ID
   * @return {object} Question
   */
  async downvote(req, res, next) {
    try {
      const _id = req.params.id;
      const question = await QuestionModel.findByIdAndUpdate(
        _id,
        {$inc: { votes: -1 } },
        { safe: true, multi: true, new: true }
      )
      if (question) {
        return handleSuccess(req, res, HttpStatus.OK, 'Question has been downvoted', question)
      }
      return handleError(req, res, HttpStatus.NOT_FOUND, 'Question not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error downvoting question', error)
    }
  },

  /**
   * Subscribe
   * @description This subscribes a user to a Question
   * @param   {string}  id  Question's ID
   * @return {object} Subscription
   */
  async subscribe(req, res, next) {
    try {
      let subscribe = new SubscribeModel({
        user: req.jwtUser._id,
        question: req.params.id
      })
      subscribe = await subscribe.save()
      return handleSuccess(req, res, HttpStatus.CREATED, 'User has been subscribed successfully', subscribe)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error subscribing question', error)
    }
  },

  /**
   * Answer Question
   * @description This answers a user's Question
   * @param   {string}  id  Question's ID
   * @return {object} Subscription
   */
  async answer(req, res, next) {
    try {
      const text = req.body.text
      let answer = new AnswerModel({
        user: req.jwtUser._id,
        question: req.params.id,
        text
      })
      answer = await answer.save()
      const subscribers = await SubscribeModel.find({question: req.params.id}).populate('question').populate('user')
      console.log("subscribers: "+subscribers.length)
      if (subscribers.length > 0) {
        subscribers.map((subscriber) => {
          publisher.queue('SEND_USER_STACKOVERFLOW_QUESTION_SUB_EMAIL', { email: subscriber.user.email, question: subscriber.question.title })
        })
      }
      return handleSuccess(req, res, HttpStatus.CREATED, 'Question has been answered successfully', answer)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error answering question', error)
    }
  },

  /**
   * Update Question
   * @description This updates a Question
   * @param   {string}  id  Question's ID
   * @return {object} Question
   */
  async update(req, res, next) {
    try {
      const { votes, user, ...body } = req.body;
      const _id = req.params.id;
      const team = await QuestionModel.findByIdAndUpdate(
        _id,
        { $set: body },
        { safe: true, multi: true, new: true }
      )
      if (question) {
        return handleSuccess(req, res, HttpStatus.OK, 'Question has been updated', team)
      }
      return handleError(req, res, HttpStatus.NOT_FOUND, 'Question not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error updating question', error)
    }
  },

  /**
   * Update Team
   * @description This removes a team details in thw Premier League Ecosystem.
   * @param   {string}  id  Team's ID
   * @return {object} team
   */
  async remove(req, res, next) {
    try {
      const _id = req.params.id;
      const question = await QuestionModel.findByIdAndRemove(
        _id,
        { safe: true, multi: true, new: true }
      )
      if (question) {
        return handleSuccess(req, res, HttpStatus.NO_CONTENT, 'Question has been removed', null)
      }
      return handleError(req, res, HttpStatus.NOT_FOUND, 'Question not found', null)
    } catch (error) {
      return handleError(req, res, HttpStatus.INTERNAL_SERVER_ERROR, 'Error updating question', error)
    }
  }
};

module.exports = QuestionController;
