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
    token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDI2NzUwYTViOTUwYjAwMTc0YzUyMmMiLCJ0ZW5hbnRJZCI6IjFBRjIzODBFLUI2MzQtNDlFOS1CQTFDLTk3NzNFNkMyMEQ0QyIsImVtYWlsIjoiYWthc2hAZ21haWwuY29tIiwicGhvbmUiOiIwMTcyMTA3MDcxNyIsInJvbGVzIjpbImFwcHVzZXIiLCJhZG1pbiJdLCJpYXQiOjE2MTc0NTQyMDgsImV4cCI6MTYxNzQ1NzgwOH0.s2qLWWA4rvzQoei3anK4-uB6PLmnWs3eKXWttjCkNJZEKzqErJcw1x3SnABX_a-cV3526SNOkJrfXyJFu0EEVzZC0J5uN9V0ZT-TZgi2z8dtTE_EtdDdjspcqzma6-cMUlGp-VOhTjsxXERpWT07DWATPXoDQFdB4U6OFNaWQy8aBrBuUPCaj7sPyy2x5B0zAHj1zdfL7lghQ2g7EWmOMHQtMkgbV9Hbco7btq4tWqHTGWj3GO8FJ0MHBVMIapX-uP_hqMXwfH1frp4bjPdcmh6WCZHgFu-gJ3pNG6TpUG9yM2mpx8JEK31t7VAL3ofDfjcQQget6Ei8XQMjVrHn3onNLnoqSldpY6aqbm5fTjCbKAj0NTCCrh3lUXnuI-ZvbxbNQeFHFLneOPWS_9VD1EFZf-xigW7G1YO8QUnOf6cQ3gRfmQggoVuPemH57oDXLZ4hxzQZhsH2JM5V_q2X8DLQZCRZUz1hNJehnHFro4ujCaRm-dwnazArI90aYImu";
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
