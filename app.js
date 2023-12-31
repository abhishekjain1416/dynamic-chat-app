require('dotenv').config();
const { MONGODB_URI, MONGODB_DATABASE } = process.env;

var mongoose = require('mongoose');

mongoose.connect(MONGODB_URI + MONGODB_DATABASE);

const express = require('express');

const app = express();

const http = require('http').Server(app);

const userRoute = require('./routes/userRoute');

app.use('/',userRoute);

const User = require('./models/userModel');
const Chat = require('./models/chatModel');

const io = require('socket.io')(http);

var usp = io.of('/user-namespace');

usp.on('connection', async function(socket){
    console.log('User connected.');

    var userId = socket.handshake.auth.token;
    await User.findByIdAndUpdate({_id:userId}, {$set:{is_online:'1'}});

    socket.broadcast.emit('getOnlineUser', { user_id: userId });

    socket.on('disconnect', async function(){
        console.log('User disconnected.');
        await User.findByIdAndUpdate({_id:userId}, {$set:{is_online:'0'}});

        socket.broadcast.emit('getOfflineUser', { user_id: userId });
    });

    socket.on('newChat', function(data){
        socket.broadcast.emit('loadNewChat', data);
    });

    // Load old chats from MongoDB
    socket.on('existsChats', async function(data){
        var chats = await Chat.find({$or:[
            {sender_id:data.sender_id, receiver_id:data.receiver_id},
            {sender_id:data.receiver_id, receiver_id:data.sender_id}
        ]});

        socket.emit('loadChats', { chats: chats });
    });

    // Delete chat
    socket.on('chatDeleted', function(id){
        socket.broadcast.emit('chatMessageDeleted', id);
    });

    // Update chat
    socket.on('chatUpdated', function(data){
        socket.broadcast.emit('chatMessageUpdated', data);
    });
});

http.listen(3000,function(){
    console.log('Server is running...');
});