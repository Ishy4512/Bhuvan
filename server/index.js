const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store current state of each room
const roomStates = {}; // { roomId: { url: string, playing: boolean, time: number } }
const roomUsers = {};  // { roomId: [{ id: socketId, username: string }] }

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join_room', ({ room, username }) => {
    socket.join(room);
    socket.data.room = room; // Store room and username on socket for disconnect
    socket.data.username = username;

    if (!roomUsers[room]) {
      roomUsers[room] = [];
    }
    // Remove any existing entry for this socket.id before adding the new one
    roomUsers[room] = roomUsers[room].filter(user => user.id !== socket.id);
    roomUsers[room].push({ id: socket.id, username });
    console.log(`${username} joined room: ${room}`);

    // Send current room state to the joining user
    if (roomStates[room]) {
      socket.emit('action', { action: { type: 'URL_CHANGE', url: roomStates[room].url } });
      socket.emit('action', { action: { type: roomStates[room].playing ? 'PLAY' : 'PAUSE' } });
      socket.emit('action', { action: { type: 'SEEK', time: roomStates[room].time } });
    }

    // Notify everyone in the room about the new user and send updated user list
    io.to(room).emit('user_joined', { username, users: roomUsers[room] });
  });

  socket.on('action', (data) => {
    // Update room state based on action
    if (!roomStates[data.room]) {
      roomStates[data.room] = { url: null, playing: false, time: 0 };
    }

    switch (data.action.type) {
      case 'URL_CHANGE':
        roomStates[data.room].url = data.action.url;
        roomStates[data.room].playing = true;
        roomStates[data.room].time = 0;
        break;
      case 'PLAY':
        roomStates[data.room].playing = true;
        break;
      case 'PAUSE':
        roomStates[data.room].playing = false;
        break;
      case 'SEEK':
        roomStates[data.room].time = data.action.time;
        break;
      default:
        break;
    }
    // Broadcast action to all others in the room
    socket.to(data.room).emit('action', data);
  });

  socket.on('disconnect', () => {
    const { room, username } = socket.data;
    if (room && username && roomUsers[room]) {
      roomUsers[room] = roomUsers[room].filter(user => user.id !== socket.id);
      console.log(`${username} left room: ${room}`);
      // Notify everyone in the room about the user leaving and send updated user list
      io.to(room).emit('user_left', { username, users: roomUsers[room] });

      // If room is empty, clear its state
      if (roomUsers[room].length === 0) {
        delete roomStates[room];
        delete roomUsers[room];
        console.log(`Room ${room} is empty, state cleared.`);
      }
    }
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});