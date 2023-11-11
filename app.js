require('dotenv').config();

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/dynamic-chat-app');

const express = require('express');

const app = express();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute');

app.use('/',userRoute);

http.listen(3000,function(){
    console.log('Server is running...');
});