const express = require('express');
const router = express.Router();
const propertyController = require('../controllers/propertyController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Secure all endpoints below this line - User must be logged in AND be an Admin or Caretaker
router.use(protect);
router.use(restrictTo('Admin', 'Caretaker'));

// ====================================================================
// PROPERTY ROUTES
// ====================================================================
router.post('/create', propertyController.createProperty);
router.get('/', propertyController.getAllProperties);

// ====================================================================
// UNIT (ROOM) ROUTES
// ====================================================================
router.post('/unit/add', propertyController.addUnit);
router.get('/units', propertyController.getUnits);

// 🚀 NEW: Update utility & billing configuration for a specific room
//router.patch('/units/:id/billing', propertyController.updateUnitBilling);

module.exports = router;