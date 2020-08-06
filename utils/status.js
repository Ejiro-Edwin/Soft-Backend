module.exports = {
  OK: 200,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  UNAUTHORIZED: 401,
  PRECONDITION_FAILED: 412,
  SERVER_ERROR: 500,
  NO_AMPQ_URL_ERROR: 'Please specify an AMQP connection string.',
  INIT_EVENTBUS_ERROR: 'Please initialize the Event Bus by calling `.init()` before attempting to use the Event Bus.',
  INIT_SOCKET_ERROR: 'Please initialize the Socket by calling `.init()` before attempting to use the socket connection.',
}
