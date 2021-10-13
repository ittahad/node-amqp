process.env.NODE_ENV = 'prod';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var Rabbit = require('./packages/rabbitmq');
const AppSettings = require(`./config.${process.env.NODE_ENV}`);
var config = new AppSettings();
var rabbitMq = new Rabbit(config);
var testCallback = require('./callbacks/testCallback');

var app = express();

class TestCommandAnother
{
  constructor(msg) {
    this.message = msg;
  }
}

var command = new TestCommandAnother("test");

rabbitMq.registerCallback(testCallback, TestCommandAnother);

rabbitMq.prepareChannel(channel => {
  setInterval(() => {
    token = "**TEST_TOKEN**";
    rabbitMq.sendToQueue("TestQueue", channel, token, command);
  }, 200);
});


rabbitMq.listen("TestExchange", "TestQueue", channel => {
  channel.prefetch(1);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
