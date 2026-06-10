const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const adminDashboardController = require('../controllers/adminDashboardController');

// All routes here are protected and restricted to Admin
router.use(protect, restrictTo('Admin'));

// GET /api/v1/admin-dashboard/stats
router.get('/stats', adminDashboardController.getEstateOverview);

module.exports = router;