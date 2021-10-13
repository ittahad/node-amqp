
const fs = require('fs');
function AppSettings() {

    const PUB_KEY = fs.readFileSync(__dirname + '/public-key.pem', 'utf8');

    this.secretKey = PUB_KEY;

    this.mongoTenants = 'mongodb://localhost:27017/Tenants';
    this.redisHost = "redis://{{YOUR_CONNECTION_STRING}}";
    this.redisPass = "{{YOUR_CONNECTION_SECRET}}";
    this.rabbitMqConnection = "{{YOUR_RABBITMQ_SECRET}}";
    this.mongoDb = (dbName) => {
        return `mongodb://localhost:27017/${dbName}`;
    }
};

module.exports = AppSettings;
