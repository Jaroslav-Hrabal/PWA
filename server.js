const path = require('path');
const express = require('express');
const http = require('http');
const formatMessage = require('./messages');
const {joinUser, leaveUser, getUser, getRoomUsers} = require('./users')
const app = express();
app.use(express.static(path.join(__dirname, 'front')));

const PORT= 3000 || process.env.PORT;

const server = http.createServer(app);
server.listen(PORT, () => console.log('Server running on port $(PORT)'));

const socketio = require('socket.io')
const io = socketio(server);

const bot = 'Chatbot';


// user connects
io.on('connection', socket => {
  socket.on('joinRoom', ({ username, room }) => {
    const user = joinUser(socket.id, username, room);

    socket.join(user.room);

    // Welcome msessage
    socket.emit('message', formatMessage(bot, 'Welcome to chat!'));

    // Broadcast to room when a user connects
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(bot, `${user.username} has joined the chat`)
      );

    // Send users and room info
    io.to(user.room).emit('roomUsers', {
      room: user.room,
      users: getRoomUsers(user.room)
    });
  });


  //user disconnects
  socket.on('disconnect', () => {
    const user = leaveUser(socket.id);

    if (user) {
      io.to(user.room).emit(
        'message',
        formatMessage(bot, `${user.username} has left the chat`)
      );

      // Send users and room info
      io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
      });
    }
  });
  // Listen for chatMessage
    socket.on('chatMessage', msg => {
      const user = getUser(socket.id);
  
      io.to(user.room).emit('message', formatMessage(user.username, msg));
    });
  
});
