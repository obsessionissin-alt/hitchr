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

// Get user's rides
router.get('/', rideController.getUserRides);

// Get ride by ID
router.get('/:id', rideController.getRideById);

// Accept ride (pilot only) - legacy, may not be used with proximity flow
router.post('/:id/accept', rideController.acceptRide);

// Confirm ride (when proximity match happens - both rider and pilot)
router.patch('/:id/confirm', rideController.confirmRide);

// Start ride (after both confirmed)
router.patch('/:id/start', rideController.startRide);

// End ride
router.patch('/:id/end', rideController.endRide);

module.exports = router;
