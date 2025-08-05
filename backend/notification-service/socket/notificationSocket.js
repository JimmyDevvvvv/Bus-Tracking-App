import { Server } from 'socket.io';

export const setupNotificationSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to notification service:', socket.id);

    // Join user's notification room
    socket.on('join-user-room', ({ userId }) => {
      socket.join(`user-${userId}`);
      socket.userId = userId;
      console.log(`User ${userId} joined notification room`);
    });

    // Leave user's notification room
    socket.on('leave-user-room', ({ userId }) => {
      socket.leave(`user-${userId}`);
      console.log(`User ${userId} left notification room`);
    });

    // Join bus notification room
    socket.on('join-bus-notifications', ({ busId }) => {
      socket.join(`bus-notifications-${busId}`);
      console.log(`Client joined bus notifications: bus-${busId}`);
    });

    // Leave bus notification room
    socket.on('leave-bus-notifications', ({ busId }) => {
      socket.leave(`bus-notifications-${busId}`);
      console.log(`Client left bus notifications: bus-${busId}`);
    });

    // Handle notification preferences
    socket.on('update-notification-preferences', ({ userId, preferences }) => {
      // Store user notification preferences
      socket.notificationPreferences = preferences;
      console.log(`User ${userId} updated notification preferences`);
    });

    // Handle notification acknowledgment
    socket.on('acknowledge-notification', ({ notificationId, userId }) => {
      io.to(`user-${userId}`).emit('notification-acknowledged', {
        notificationId,
        acknowledgedAt: new Date()
      });
    });

    // Handle emergency broadcast
    socket.on('emergency-broadcast', ({ busId, message, type }) => {
      io.to(`bus-notifications-${busId}`).emit('emergency-notification', {
        busId,
        message,
        type,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected from notification service:', socket.id);
    });
  });

  return io;
}; 