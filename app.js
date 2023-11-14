require('dotenv').config();

var mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/dynamic-chat-app');

const express = require('express');

const app = express();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute');

app.use('/',userRoute);

const User = require('./models/userModel');

const io = require('socket.io')(http);

var usp = io.of('/user-namespace');

usp.on('connection', async function(socket){
    console.log('User connected.');

    var userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id:userId}, {$set:{is_online:'1'}});

    socket.on('disconnect', async function(){
        console.log('User disconnected.');
        await User.findByIdAndUpdate({_id:userId}, {$set:{is_online:'0'}});
    });
});

http.listen(3000,function(){
    console.log('Server is running...');
});