// backend/src/routes/pilots.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const pilotController = require('../controllers/pilotController');

// All pilot routes require authentication
router.use(authMiddleware);

// Update pilot location
router.post('/location', pilotController.updateLocation);

// Get nearby pilots
router.get('/nearby', pilotController.getNearbyPilots);

module.exports = router;