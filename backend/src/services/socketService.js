const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

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

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      if (token.startsWith('dev_mock_token_')) {
        // For dev, keep userId exactly the token so rooms match client IDs
        socket.userId = token;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Handle authentication confirmation
    socket.on('authenticate', (data) => {
      socket.emit('authenticated', { userId: socket.userId });
    });

    // Notify flows (A -> B, then B -> A)
    socket.on('notify:send', (data = {}, callback = () => {}) => {
      try {
        const payload = {
          fromUserId: socket.userId || data.fromUserId,
          toUserId: data.toUserId,
          rideRequestId: data.rideRequestId || `notify-${Date.now()}`,
          marker: data.marker,
          status: data.status || 'sent',
        };

        if (!payload.fromUserId || !payload.toUserId) {
          throw new Error('Missing user information');
        }

        io.to(`user:${payload.toUserId}`).emit('notify:received', payload);
        callback({ ok: true });
      } catch (error) {
        console.error('notify:send error', error.message);
        callback({ ok: false, error: error.message });
      }
    });

    socket.on('notify:accept', (data = {}, callback = () => {}) => {
      try {
        const payload = {
          ...data,
          fromUserId: socket.userId || data.fromUserId,
          status: 'accepted',
        };

        if (!payload.fromUserId || !payload.toUserId) {
          throw new Error('Missing user information');
        }

        io.to(`user:${payload.toUserId}`).emit('notify:updated', payload);
        callback({ ok: true });
      } catch (error) {
        console.error('notify:accept error', error.message);
        callback({ ok: false, error: error.message });
      }
    });

    socket.on('notify:decline', (data = {}, callback = () => {}) => {
      try {
        const payload = {
          ...data,
          fromUserId: socket.userId || data.fromUserId,
          status: 'declined',
        };

        if (!payload.fromUserId || !payload.toUserId) {
          throw new Error('Missing user information');
        }

        io.to(`user:${payload.toUserId}`).emit('notify:updated', payload);
        callback({ ok: true });
      } catch (error) {
        console.error('notify:decline error', error.message);
        callback({ ok: false, error: error.message });
      }
    });

    // Handle location updates (dual-role system)
    socket.on('user:location-update', async (data) => {
      const { userId, lat, lng, heading, speed, isPilotAvailable, isRiderAvailable, timestamp } = data;

      if (!lat || !lng) {
        socket.emit('error', { message: 'Invalid location data' });
        return;
      }

      try {
        // Broadcast to nearby users based on availability
        // In production, this would query nearby users within radius
        
        if (isPilotAvailable) {
          // Broadcast to riders
          socket.broadcast.emit('pilot:location-update', {
            userId,
            lat,
            lng,
            heading,
            speed,
            timestamp,
          });
        }

        if (isRiderAvailable) {
          // Broadcast to pilots
          socket.broadcast.emit('rider:location-update', {
            userId,
            lat,
            lng,
            timestamp,
          });
        }
      } catch (error) {
        console.error('Location update error:', error);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    // Handle ride-specific events
    socket.on('ride:join', (rideId) => {
      socket.join(`ride:${rideId}`);
      console.log(`User ${socket.userId} joined ride ${rideId}`);
    });

    socket.on('ride:leave', (rideId) => {
      socket.leave(`ride:${rideId}`);
      console.log(`User ${socket.userId} left ride ${rideId}`);
    });

    // Live ride location sharing
    socket.on('ride:location-share', (data) => {
      const { rideId, lat, lng, heading, speed } = data;
      
      // Broadcast to other participant in the ride
      socket.to(`ride:${rideId}`).emit('ride:partner-location', {
        userId: socket.userId,
        lat,
        lng,
        heading,
        speed,
        timestamp: Date.now(),
      });
    });

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.userId}`);
    });

    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.userId}:`, error);
    });
  });

  console.log('✅ Socket.io initialized');
  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Emit event to a specific user
 */
const emitToUser = (userId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Emit event to multiple users
 */
const emitToUsers = (userIds, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  userIds.forEach(userId => {
    io.to(`user:${userId}`).emit(event, data);
  });
};

/**
 * Emit event to a ride room
 */
const emitToRide = (rideId, event, data) => {
  if (!io) {
    console.error('Socket.io not initialized');
    return;
  }

  io.to(`ride:${rideId}`).emit(event, data);
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToUsers,
  emitToRide,
};
