const express = require('express');
const app = express();
const PORT = 4000;

const http = require('http').Server(app);
const cors = require('cors');
app.use(cors());

const socketIO = require('socket.io')(http, {
  cors: {
    origin: "http://localhost:3000"
  }
});

const usersPerCodeBlock = {};

socketIO.on('connection', (socket) => {
  const userId = socket.id;

  socket.on('login', ({ codeBlockId }, callback) => {
    console.log(`Login made for code block id:${codeBlockId} by user with id:${userId}`);
    socket.join(codeBlockId);

    if (usersPerCodeBlock[codeBlockId] && Object.keys(usersPerCodeBlock[codeBlockId]).length > 0) {
      if (!usersPerCodeBlock[codeBlockId][userId]) {
        usersPerCodeBlock[codeBlockId][userId] = { isMentor: false };
      } 
    } else {
      usersPerCodeBlock[codeBlockId] = {};
      usersPerCodeBlock[codeBlockId][userId] = { isMentor: true };
    }
    callback(usersPerCodeBlock[codeBlockId][userId]);
  });

  socket.on('code', (data) => {
    const codeBlockId = data.codeBlockId;
    socketIO.to(codeBlockId).emit('Response', data);
  });

  socket.on('disconnect', () => {
    for (const [codeBlockId, usersObject] of Object.entries(usersPerCodeBlock)) {
      const newUsersObject = usersObject;
      delete newUsersObject[userId];
      usersPerCodeBlock[codeBlockId] = newUsersObject;
    }
    console.log(`User with id:${userId} disconnected`);
  });
});

http.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
