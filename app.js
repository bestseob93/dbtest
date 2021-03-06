var express = require('express');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var mysqlstore = require('express-mysql-session')(session);
var bkfd2Password = require('pbkdf2-password');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

var card = require('./routes/card');
var auth = require('./routes/auth');
var group = require('./routes/group');

var hasher = bkfd2Password();

var options = {
  'host' : 'appjam-ping.cfsveedruyrb.ap-northeast-2.rds.amazonaws.com',
  'port' : '3306',
  'user' : 'ping',
  'password' : 'd85z85755',
  'database' : 'pingdb'
};

var sessionstore = new mysqlstore(options);

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(session({
  key : 'sid',
  secret : 'asasdfdfsf',
  resave : false,
  saveUninitialized : false,
  cookie : {
    maxAge: 1000 * 60 // 쿠키 유지 시간
  },
  store : sessionstore
}));
app.use(passport.initialize());
app.use(passport.session());


app.use(express.static(path.join(__dirname, 'public')));


app.use('/card', card);
app.use('/auth', auth);
app.use('/group', group);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
