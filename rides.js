// backend/src/routes/rides.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

// Import controller
const rideController = require('../controllers/rideController');

// All routes require authentication
router.use(authMiddleware);

// Create ride request (notify pilot)
router.post('/notify', rideController.createRide);

// Get user's rides (must be before /:id route to avoid conflict)
router.get('/', rideController.getUserRides);

// Get ride by ID
router.get('/:id', rideController.getRideById);

// Accept ride (pilot only)
router.post('/:id/accept', rideController.acceptRide);

// Confirm/Start ride (both can confirm)
router.patch('/:id/confirm', rideController.startRide);
router.patch('/:id/start', rideController.startRide);

// End ride
router.patch('/:id/end', rideController.endRide);

module.exports = router;
