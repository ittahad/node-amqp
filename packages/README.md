# AMQP Library for App Cloud Platform

This is the library to use amqp within the ACP platform.


## Installation

Initialize the RabbitMq connection.

```javascript
// config has rabbitMqConnection property

var RabbitMqConnection = require('lib-acp-amqp');
const rabbitMq = new RabbitMqConnection(config);
```

## Usage

```javascript
// Configuration file

const fs = require('fs');
function AppSettings() {

    const PUB_KEY = fs.readFileSync(__dirname + '/public-key.pem', 'utf8');

    this.secretKey = PUB_KEY;

    this.mongoTenants = '***';
    this.redisHost = "***";
    this.redisPass = "***",
    this.rabbitMqConnection = "***";
    this.mongoDb = (dbName) => {
        return `mongodb://host:port/${dbName}`;
    }
};
module.exports = AppSettings;
```

```javascript
class TestCommand {
  constructor(msg) {
    this.message = msg;
  }
}
```

##### Receive messages

```javascript
// testMessageHandler.js

callback = (msg) => {
    console.log("message received!!");
    console.log(msg);
}
module.exports = callback ;
```

```javascript
// main.js

var testCallback = require('./handlers/TestMessageHandler');
rabbitMq.registerCallback(testCallback, TestCommand);

var handler = require('./handlers/TestMessageHandler');
rabbitMq.listen("TestExchange", "TestQueue", ch => {
  ch.prefetch(1);
});
```

##### Send messages

```javascript
var command = new TestCommand("value");
rabbitMq.prepareChannel(ch => {
  rabbitMq.sendToQueue("TestQueue", ch, command);
});
```

## License
[MIT](https://choosealicense.com/licenses/mit/)