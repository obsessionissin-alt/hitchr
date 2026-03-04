// backend/src/routes/users.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const userController = require('../controllers/userController');

// All user routes require authentication
router.use(authMiddleware);

// Get current user
router.get('/me', userController.getCurrentUser);

// Update current user profile
router.patch('/me', userController.updateProfile);

// Update availability status (dual-role system)
router.patch('/me/availability', userController.updateAvailability);

// Get user by ID (public profile)
router.get('/:id', userController.getUserById);

module.exports = router;
