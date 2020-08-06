const amqp = require('amqplib');
const HttpStatus = require('./status')

const RabbitMQ = {
  connection: '',
  channel: '',
  async init(amqp_url) {
    if (this.connection) return true; // prevents us from carelessly creating multiple AMQP connections in our app.

    if (!amqp_url) throw new Error(HttpStatus.NO_AMPQ_URL_ERROR);

    // set connection heartbeat to 60
    const connectionUrl = `${amqp_url}?heartbeat=60`;

    // create connection
    this.connection = await amqp.connect(connectionUrl);

    // create channel
    this.channel = await this.connection.createChannel();
    console.log('RabbitMQ Connected')
    return true;
  },

  isEventBusInitialized() {
    if (!this.connection || !this.channel) throw new Error(HttpStatus.INIT_EVENTBUS_ERROR);
  },

  async close() {
    this.isEventBusInitialized();
    await this.connection.close();
  },

  getChannel() {
    this.isEventBusInitialized();
    return this.channel;
  },

  getConnection() {
    this.isEventBusInitialized();
    return this.connection;
  },

  /**
   * Emits an event via the passed-in `exchange`
   * Works as a pub-sub publisher.
   * @param exchange Exhange to emit the event on
   * @param event Event to be emitted (routing key)
   * @param data The data to be emitted
   * @param options RabbitMQ Publish options
   * @returns {Promise<boolean>}
   */
  async emit(exchange, event, data, options) {
    this.isEventBusInitialized();
    await this.channel.assertExchange(exchange, 'topic');
    const message = Buffer.from(JSON.stringify(data));
    return this.channel.publish(exchange, event, message, options);
  },

  /**
   * Pushes data to the queue `queueName`
   * @param queueName Queue to push data to
   * @param data Data to be pushed to queue `queueName`
   * @param options RabbitMQ Publish options
   * Messages are persistent by default.
   * @return {boolean}
   */
  async queue(queueName, data, options) {
    this.isEventBusInitialized();
    await this.channel.assertQueue(queueName, { durable: true });
    const message = Buffer.from(JSON.stringify(data));
    return this.channel.sendToQueue(queueName, message, {
      persistent: true,
      ...options,
    });
  },

  /**
   * Listens for an `event` on an `exchange` and invokes the provided `callback` when
   * the event gets emitted.
   * Works as a pub-sub subscriber.
   * @param exchange Exchange to listen for events on
   * @param event Event to be consumed (routing key)
   * @param callback Callback to be invoked when event gets emitted
   * @returns Promise<amqp.Replies.Consume> AMQP reply
   */
  async on(exchange, event, callback) {
    this.isEventBusInitialized();

    await this.channel.assertExchange(exchange, 'topic');

    // create temporary queue that gets deleted when connection closes
    const { queue } = await this.channel.assertQueue('', {
      exclusive: true,
    });

    await this.channel.bindQueue(queue, exchange, event);

    return this.channel.consume(queue, callback, {
      noAck: true,
    });
  },

  /**
   * Consumes tasks/messages from a queue `queueName` and invokes the provided callback
   * @param queueName Queue to consume tasks from
   * @param callback Callback to be invoked for each message that gets sent to the queue
   * @param limit The number of concurrent jobs the consumer can handle. Defaults to 3
   * @param options Optional options. If the noAck option is set to true or not specified,
   * you are expected to call channel.ack(message) at the end of the supplied
   * callback inorder to notify the queue that the message has been acknowledged.
   */
  async consume(queueName, callback, limit, options) {
    this.isEventBusInitialized();

    // limit number of concurrent jobs
    this.channel.prefetch(limit);
    await this.channel.assertQueue(queueName, { durable: true });
    return this.channel.consume(queueName, callback, options);
  },

  /**
   * Acknowledges a message.
   * @param message The message to be acknowledged
   */
  acknowledgeMessage(message) {
    this.isEventBusInitialized();
    this.channel.ack(message);
  },

  /**
   * Rejects a message and requeues it by default.
   * @param message The message to be reject
   * @param requeue Boolean flag on if the message should be requeued. Defaults to true
   */
  rejectMessage(message, requeue) {
    this.isEventBusInitialized();
    this.channel.nack(message, false, requeue);
  }

}
module.exports = RabbitMQ;
