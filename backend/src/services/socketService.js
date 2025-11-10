
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { client: redis } = require('../config/redis');

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userRole = decoded.role;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId} (${socket.userRole})`);

    socket.join(`user:${socket.userId}`);
    socket.join(`role:${socket.userRole}`);

    socket.on('pilot:location-update', async (data) => {
      if (socket.userRole !== 'pilot') {
        socket.emit('error', { message: 'Only pilots can update location' });
        return;
      }

      const { lat, lng, heading, speed } = data;

      if (!lat || !lng) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }

      try {
        await redis.setEx(
          `pilot_location:${socket.userId}`,
          parseInt(process.env.PILOT_LOCATION_TTL) || 30,
          JSON.stringify({ lat, lng, heading, speed, timestamp: Date.now() })
        );

        socket.to('role:rider').emit('pilot:location-updated', {
          pilotId: socket.userId,
          location: { lat, lng, heading, speed }
        });
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('ride:join', (rideId) => {
      socket.join(`ride:${rideId}`);
      console.log(`User ${socket.userId} joined ride ${rideId}`);
    });

    socket.on('ride:leave', (rideId) => {
      socket.leave(`ride:${rideId}`);
      console.log(`User ${socket.userId} left ride ${rideId}`);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};

