const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const userSocketMap = new Map();
let io;

function setupSocket(server) {
  io = new Server(server, {
    cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = payload.id; // giả sử payload có id user
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id, 'User:', socket.userId);
    // Lưu userId - socketId map
    userSocketMap.set(String(socket.userId), socket.id);

    socket.on('disconnect', () => {
      userSocketMap.delete(String(socket.userId));
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

module.exports = { setupSocket, getIO, userSocketMap };
