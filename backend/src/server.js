require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { connectRedis } = require('./config/redis');
const { pool, testConnection } = require('./config/database');
const { initializeSocket } = require('./services/socketService');
const { startProximityService } = require('./services/proximityService');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const pilotRoutes = require('./routes/pilots');
const rideRoutes = require('./routes/rides');
const tokenRoutes = require('./routes/tokens');
const nearbyRoutes = require('./routes/nearby');
const locationRoutes = require('./routes/location');

const app = express();
const server = http.createServer(app);

// CORS Configuration - Single place, before other middleware
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:8082',   // Added for web on port 8082
    'http://localhost:19006',
    'http://localhost:19000',
    'http://192.168.1.31:8081',
    'http://192.168.1.31:19006',
    'http://192.168.1.52:8081',   // Mobile IP
    'http://192.168.1.52:19006',  // Mobile IP
    'http://192.168.1.52:19000',  // Mobile IP
    'http://192.168.1.100:8081',   // Old IP (keep for compatibility)
    'http://192.168.1.100:19006',
    'http://192.168.1.100:19000',
    'http://192.168.1.207:8081',   // NEW: Your actual IP
    'http://192.168.1.207:19006',  // NEW
    'http://192.168.1.207:19000'   // NEW
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Relax rate limiting in non-production to allow dense dev polling (location + nearby)
if (process.env.RATE_LIMIT_DISABLED !== 'true') {
  app.use(generalLimiter);
} else {
  console.warn('⚠️  Rate limiting disabled via RATE_LIMIT_DISABLED=true');
}

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

const API_VERSION = process.env.API_VERSION || 'v1';
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/users`, userRoutes);
app.use(`/api/${API_VERSION}/pilot`, pilotRoutes);
app.use(`/api/${API_VERSION}/location`, locationRoutes);
app.use(`/api/${API_VERSION}/nearby`, nearbyRoutes);
app.use(`/api/${API_VERSION}/rides`, rideRoutes);
app.use(`/api/${API_VERSION}/tokens`, tokenRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    console.log('🚀 Starting HITCH Backend...\n');
    
    console.log('📦 Connecting to PostgreSQL...');
    await testConnection();
    console.log('');
    
    console.log('📦 Connecting to Redis...');
    await connectRedis();
    console.log('');
    
    console.log('🔌 Initializing Socket.io...');
    initializeSocket(server);
    
    console.log('📍 Starting proximity detection service...');
    startProximityService();
    
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✅ Server running on port ${PORT}`);
      console.log(`📡 API: http://localhost:${PORT}/api/${API_VERSION}`);
      console.log(`🔍 Health: http://localhost:${PORT}/health`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
   
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', async () => {
  console.log('\n⚠️  SIGTERM received, shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  SIGINT received, shutting down gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('✅ Server shut down complete');
    process.exit(0);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

startServer();

module.exports = { app, server };
