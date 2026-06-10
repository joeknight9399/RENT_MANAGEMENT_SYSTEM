const express = require('express');
const router = express.Router();
const landlordController = require('../controllers/landlordController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
// NOTE: Make sure your auth protection checks req.user.role === 'Admin'

router.get('/overview', protect, restrictTo('Admin'), landlordController.getLandlordDashboard);

module.exports = router;