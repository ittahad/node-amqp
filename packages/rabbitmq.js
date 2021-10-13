const jwt = require("jsonwebtoken");

class RabbitMq {

  constructor(config)
  {
    this.callbacks = {};
    this.config = config;
    this.open = require('amqplib').connect(config.rabbitMqConnection);
  }

  verifyAmqpToken = (receivedMessage, securityContext, callback) => {
    let authInfo = receivedMessage.authInfo;
    if (authInfo === null || authInfo === undefined) {
      return ch.nack(receivedMessage);
    }
    callback(receivedMessage, securityContext);
  };

  prepareChannel = (callback)=> {
    this.open.then((conn) => {
        return conn.createChannel();
      }).then((ch) => {
        callback(ch);
      }).catch(console.warn);
  };

  sendToQueue = (queueName, ch, authToken, msg) => {
    if(authToken === null || authToken === undefined)
    {
      console.log("Invalid auth token");
      return;
    }
    let tokenPayload = jwt.verify(authToken, this.config.secretKey, { algorithms: ['RS256'] });
    return ch.assertQueue(queueName).then((ok) => {
      return ch.sendToQueue(queueName, Buffer.from(JSON.stringify({
        'callbackTag': msg.constructor.name,
        'payload': msg,
        'authInfo': {
          'userId': tokenPayload._id,
          'tenantId': tokenPayload.tenantId,
          'email': tokenPayload.email,
          'phone': tokenPayload.phone,
          'roles': tokenPayload.roles
        }
      })));
    });
  }

  getAuthInfoFromToken = (authToken) => {
    let tokenPayload = jwt.verify(authToken, this.config.secretKey, { algorithms: ['RS256'] });
    return tokenPayload;
  }

  sendToQueueWithAuth = (queueName, ch, authInfo, msg) => {
    if(authInfo === null || typeof(authInfo) === 'undefined')
    {
      console.log("Invalid authInfo");
      return;
    }

    if(authInfo.userId === null || typeof(authInfo.userId) === 'undefined') {
      console.log("Invalid userId");
      return;
    }

    if(authInfo.tenantId === null || typeof(authInfo.tenantId) === 'undefined') {
      console.log("Invalid tenantId");
      return;
    }

    if(authInfo.email === null || typeof(authInfo.email) === 'undefined') {
      console.log("Invalid user email");
      return;
    }

    if(authInfo.roles === null || typeof(authInfo.roles) === 'undefined') {
      console.log("Invalid roles");
      return;
    }
    
    return ch.assertQueue(queueName).then((ok) => {
      return ch.sendToQueue(queueName, Buffer.from(JSON.stringify({
        'callbackTag': msg.constructor.name,
        'payload': msg,
        'authInfo': authInfo
      })));
    });
  }

  listen = (exchangeName, queueName, securityContext, optionsCallback)=> {
      this.open.then((conn) => {
          return conn.createChannel();
        }).then((ch) => {
          optionsCallback(ch);
          ch.assertExchange(exchangeName, "fanout");
          return ch.assertQueue(queueName).then((ok) => {  
            ch.bindQueue(queueName, exchangeName, '');
            return ch.consume(queueName, (msg) => {
              if (msg !== null) {
                try{
                  let receivedMessage = JSON.parse(msg.content.toString());
                  if(this.callbacks[receivedMessage.callbackTag] !== null && this.callbacks[receivedMessage.callbackTag] !== undefined){
                    securityContext.dbContextAccessorForRabbitMq(receivedMessage, (sc, err) => {
                      if(err === null || err === undefined){
                        this.verifyAmqpToken(receivedMessage, sc, this.callbacks[receivedMessage.callbackTag]);
                      }
                      else {
                        console.log(err);
                      }
                    });
                  }
                  else {
                    return ch.nack(msg);
                  }
                } catch(ex){
                    console.log("Invalid message; Dequeueing the corrupt message");
                }
                ch.ack(msg);
              }
            });
          });
        }).catch(console.warn);
  };

  registerCallback = (callback, Command) => {
      this.callbacks[Command.name] = callback;
  };

}

module.exports = RabbitMq;

