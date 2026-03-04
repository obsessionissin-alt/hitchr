// backend/src/routes/rides.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const rideController = require('../controllers/rideController');

// All routes require authentication
router.use(authMiddleware);

// Create notification (Rider → Pilot flow)
router.post('/notify', rideController.createNotification);

// Create offer (Pilot → Rider flow)
router.post('/offer', rideController.createOffer);

// Confirm ride (both users must confirm)
router.patch('/:id/confirm', rideController.confirmRide);

// Start ride (pilot only)
router.patch('/:id/start', rideController.startRide);

// End ride
router.patch('/:id/end', rideController.endRide);

// Cancel ride
router.patch('/:id/cancel', rideController.cancelRide);

// Send telemetry during ride
router.post('/:id/telemetry', rideController.sendTelemetry);

// Get ride by ID
router.get('/:id', rideController.getRideById);

// Get ride history
router.get('/history', rideController.getRideHistory);

module.exports = router;
