// backend/src/routes/location.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');
const { locationUpdateLimiter } = require('../middleware/rateLimiter');

// All location routes require authentication
router.use(authMiddleware);

// Update user location (rate-limited per user/IP)
router.post('/update', locationUpdateLimiter, userController.updateLocation);

// Set or update destination for pilots
router.patch('/destination', userController.updateDestination);

module.exports = router;







