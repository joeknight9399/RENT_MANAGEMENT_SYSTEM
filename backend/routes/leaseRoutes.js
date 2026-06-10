const express = require('express');
const router = express.Router();
const leaseController = require('../controllers/leaseController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Lock it down: Must be logged in AND be either an Admin or Caretaker
router.use(protect);
router.use(restrictTo('Admin', 'Caretaker'));

// Onboarding route
router.post('/start', leaseController.startLease);

// Shielded Tenant Dashboard Data Request Wire
router.get('/my-portal', protect, restrictTo('Tenant'), leaseController.getTenantDashboardData);


module.exports = router;