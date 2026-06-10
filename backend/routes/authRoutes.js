const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// ─── FIX: DESTUCTURE "protect" TO MATCH YOUR MIDDLEWARE EXPORT ───
const { protect } = require('../middleware/authMiddleware');

// Map user registration to a clean POST endpoint
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);

// ─── FIX: USE "protect" AS THE GUARD MIDDLEWARE HERE ───
router.patch('/update-password', protect, authController.updatePassword);

module.exports = router;