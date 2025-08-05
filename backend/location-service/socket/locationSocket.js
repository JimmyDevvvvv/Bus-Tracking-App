import { Server } from 'socket.io';

export const setupLocationSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected to location service:', socket.id);

    // Join bus room for real-time updates
    socket.on('join-bus-room', ({ busId }) => {
      socket.join(`bus-${busId}`);
      console.log(`Client joined bus room: bus-${busId}`);
    });

    // Leave bus room
    socket.on('leave-bus-room', ({ busId }) => {
      socket.leave(`bus-${busId}`);
      console.log(`Client left bus room: bus-${busId}`);
    });

    // Handle location updates from drivers
    socket.on('location-update', async (data) => {
      const { busId, latitude, longitude, address, accuracy, speed, heading } = data;
      
      // Broadcast to all clients tracking this bus
      io.to(`bus-${busId}`).emit('bus-location', {
        busId,
        latitude,
        longitude,
        address,
        accuracy,
        speed,
        heading,
        timestamp: new Date()
      });
    });

    // Handle driver status updates
    socket.on('driver-status', (data) => {
      const { busId, status, message } = data;
      
      io.to(`bus-${busId}`).emit('driver-status-update', {
        busId,
        status,
        message,
        timestamp: new Date()
      });
    });

    // Handle emergency alerts
    socket.on('emergency-alert', (data) => {
      const { busId, type, message, location } = data;
      
      io.to(`bus-${busId}`).emit('emergency-alert', {
        busId,
        type,
        message,
        location,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected from location service:', socket.id);
    });
  });

  return io;
}; 