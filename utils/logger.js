const bunyan = require('bunyan');
const { reqSerializer } = require('./serializers');
require('dotenv').config();

const Logger = {
  log: bunyan.createLogger({
      name: process.env.APP_NAME,
      serializers: {
        err: bunyan.stdSerializers.err,
        res: bunyan.stdSerializers.res,
        req: reqSerializer,
      },
    }),

  /**
   * Logs an error along with information describing the
   * error.
   * @param err Error object
   * @param message Additional information about the error.
   */
  error (err, message){
    this.log.error({ err }, message);
  },

  /**
   * Logs arbitrary data
   * @param message Arbitrary data to be logged
   */
  message(message) {
    this.log.info(message);
  },

  /**
   * Logs an incoming HTTP request
   * @param req Express request
   */
  logAPIRequest(req) {
    this.log.info({ req });
  },

  /**
   * Logs an outgoing HTTP response
   * @param req Express request
   * @param res Express responser
   */
  logAPIResponse(req, res) {
    this.log.info({
      res,
      request_id: req.id,
    });
  },

  /**
   * Logs an error that occured during an operation
   * initiated via a HTTP request
   * @param req Express request
   * @param res Express responser
   * @param err Error object
   */
  logAPIError(req, res, err) {
    this.log.error({
      err,
      res,
      request_id: req.id,
    });
  }
  
}

module.exports = Logger;