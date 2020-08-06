const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')
const Constants = require('http-status-codes')
const UserModel = require('../models/user.model')
const logger = require('./logger')
require('dotenv').config();

exports.config = {
  jwt: process.env.JWT_SECRET,
  blockchain: '',
  mongo: '',
  host: '',
  amqp_url: '',
  port: '',
  app: process.env.APP_NAME,
  redis: ''
}

if (process.env.NODE_ENV === 'development') {
  this.config.mongo = `${process.env.MONGO_DB_DEV}`
  this.config.host = `http://localhost:${process.env.PORT}/v1/`
  this.config.db = 'backend_test'
  this.config.amqp_url = process.env.AMQP_URL
  this.config.port = `${process.env.PORT}`
} else {
  this.config.mongo = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@ds241895.mlab.com:41895/heroku_q2r42jlg`
  this.config.host = `https://backend-softcom.herokuapp.com/v1/`
  this.config.db = 'backend_test'
  this.config.amqp_url = `${process.env.CLOUDAMQP_URL}`
  this.config.port = `${process.env.PORT}`
  this.config.redis = `${process.env.REDIS_URL}`
}

console.log(this.config)

exports.sendMail = (params, callback) => {
  const email = params.email;
  // let from_email = params.from_email;
  const body = params.body;
  const subject = params.subject;
  if (email == null || body == null || subject == null) {
    return {
      status: 'failed',
      err: 'the required parameters were not supplied'
    };
  }
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    service: 'Gmail',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS
    }
  });

  const mailOptions = {
    from: 'Stackoverflow Support <support@stackoverflowclone.com>',
    to: email,
    subject,
    html: body
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      callback(error, null);
    } else {
      callback(error, info.response);
    }
  });
};

/**
 * Generate random numbers
 */
exports.generateRandomNumbers = (x) => {
  // 463309364588305
  let text = '';
  const possible = '0123456789';
  for (let i = 0; i < (x || 15); i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return ''.concat(text);
};

/**
 * Check token was sent
 */
exports.checkToken = async (req) => {
  try {
    let token = null;
    // console.log('It entered here ', req.body.token)
    if (req.headers.authorization) {
      token = req.headers.authorization
      const tokenArray = token.split(' ')
      token = tokenArray[1]
      // console.log('token ', token)
    }
    if (req.query.token) {
      token = req.query.token
    }
    if (req.body.token) {
      token = req.body.token
      // console.log('token ', token)
    }
    if (!token) {
      return {
        status: 'failed',
        data: Constants.UNAUTHORIZED,
        message: 'Not authorized'
      }
    }
    const decryptedToken = await jwt.verify(token, this.config.jwt)
    // console.log("this is the decryptedToken ",decryptedToken);

    const user = await UserModel.findById(decryptedToken.id)
    if(user){
      return {
        status: 'success',
        data: user
      }
    }
    return {
      status: 'failed',
      data: Constants.UNAUTHORIZED,
      message: 'Invalid token'
    };
  } catch (error) {
    // console.log("This is the error: ", error)
    if (error.name === 'TokenExpiredError') {
      return {
        status: 'failed',
        data: Constants.UNAUTHORIZED,
        message: 'Token expired'
      }
    }
    return {
      status: 'failed',
      data: Constants.UNAUTHORIZED,
      message: 'failed to authenticate token'
    }
  }
}

/**
 * Check token was sent
 */
exports.createJWT = (email, id) => {
  const jwtToken = jwt.sign(
    {
      email,
      id
    },
    this.config.jwt,
    {
      expiresIn: 60 * 60 * 24 * 7
    }
  )

  return jwtToken
}

exports.handleError = (req, res, code, message, err) => {
  // if (res.headerSent) console.log('Headers have been set already')
  // if (res.headersSent) return logger.error(err);
  // logger.logAPIError(req, res, err);
  console.log("error here: %o", err)
  console.log(message)
  return res.status(parseInt(code, 10)).json({
    status: 'failed',
    message,
    // err
  })
}

exports.handleSuccess = (req, res, code, message, data) => {
  // logger.logAPIResponse(req, res);
  return res.status(parseInt(code, 10)).json({
    status: 'success',
    message: message,
    data
  })
}
