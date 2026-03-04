// backend/src/routes/nearby.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// Optional auth - allows mock data without auth for demo
const optionalAuth = (req, res, next) => {
  if (req.query.withMocks === 'true') {
    // Allow unauthenticated access for demo mode
    req.user = { userId: 'demo-user' };
    return next();
  }
  // Otherwise require authentication
  return authMiddleware(req, res, next);
};

// Unified endpoint - Get all nearby users (pilots + riders)
router.get('/', optionalAuth, userController.getNearbyUsers);

// Directional matching endpoint
router.post('/matched', optionalAuth, userController.getMatchedPilots);

// Legacy endpoints (kept for backwards compatibility)
router.get('/pilots', optionalAuth, userController.getNearbyPilots);
router.get('/riders', optionalAuth, userController.getNearbyRiders);

module.exports = router;



