var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');

// Database
var mongo = require('mongodb');
var monk = require('monk');
var db = monk('localhost:27017/assignment2');

var chats = require('./routes/chats');

var app = express();

// setup session
app.use(session({
    secret: 'C3NvQdCYYE0iBhKgt9P1',
    resave: true,
    saveUninitialized: true
}));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Make db accessible to our router
app.use(function(req, res, next) {
    req.db = db;
    next();
});

// load backend js
app.use('/', chats);

module.exports = app;
