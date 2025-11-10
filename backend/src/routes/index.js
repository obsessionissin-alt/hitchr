// backend/src/routes/index.js
const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth');
const userRoutes = require('./users');
const pilotRoutes = require('./pilots');
const rideRoutes = require('./rides');
const tokenRoutes = require('./tokens');

// Health check
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/pilot', pilotRoutes);
router.use('/nearby/pilots', pilotRoutes); // Legacy compatibility
router.use('/rides', rideRoutes);
router.use('/tokens', tokenRoutes);

// 404 handler
router.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method
  });
});

module.exports = router;