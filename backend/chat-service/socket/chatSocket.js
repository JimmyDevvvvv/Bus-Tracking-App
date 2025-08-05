import { Server } from 'socket.io';

export const setupChatSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to chat service:', socket.id);

    // Join chat room
    socket.on('join-chat-room', ({ roomId, userId, userRole }) => {
      socket.join(roomId);
      socket.userId = userId;
      socket.userRole = userRole;
      console.log(`User ${userId} joined chat room: ${roomId}`);
    });

    // Leave chat room
    socket.on('leave-chat-room', ({ roomId }) => {
      socket.leave(roomId);
      console.log(`User left chat room: ${roomId}`);
    });

    // Handle typing indicator
    socket.on('typing-start', ({ roomId, userId, userName }) => {
      socket.to(roomId).emit('user-typing', {
        userId,
        userName,
        isTyping: true
      });
    });

    socket.on('typing-stop', ({ roomId, userId }) => {
      socket.to(roomId).emit('user-typing', {
        userId,
        isTyping: false
      });
    });

    // Handle message reactions
    socket.on('message-reaction', ({ roomId, messageId, reaction, userId }) => {
      io.to(roomId).emit('message-reaction-updated', {
        messageId,
        reaction,
        userId
      });
    });

    // Handle user online/offline status
    socket.on('user-online', ({ roomId, userId, userName }) => {
      io.to(roomId).emit('user-status', {
        userId,
        userName,
        status: 'online'
      });
    });

    socket.on('user-offline', ({ roomId, userId, userName }) => {
      io.to(roomId).emit('user-status', {
        userId,
        userName,
        status: 'offline'
      });
    });

    // Handle read receipts
    socket.on('message-read', ({ roomId, messageId, userId }) => {
      io.to(roomId).emit('message-read-receipt', {
        messageId,
        userId,
        readAt: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected from chat service:', socket.id);
    });
  });

  return io;
}; 