const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware'); // Ensure you use your auth middleware

// Define the route
router.get('/', protect, dashboardController.getDashboardData);

// 🚀 Fixed: Added the dashboardController prefix to match your imports
router.get('/tenant/broadcasts', protect, dashboardController.getTenantBroadcasts);

module.exports = router;