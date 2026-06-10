const express = require('express');
const router = express.Router();

// Controllers
const adminController = require('../controllers/adminController');
const unitController = require('../controllers/unitController');
const tenantController = require('../controllers/tenantController');
const billingController = require('../controllers/billingController');
const dashboardController = require('../controllers/dashboardController');
const propertyController = require('../controllers/propertyController');

// Middleware
const { protect, restrictTo } = require('../middleware/authMiddleware');

// 1. Global Protection: Ensure every route in this file is logged-in
router.use(protect);

// 2. Admin-Only High-Level Views
router.get('/dashboard-stats', restrictTo('Admin'), dashboardController.getEstateOverview);
router.get('/billing-directory', restrictTo('Admin'), billingController.getAdminInvoiceDirectory);
router.get('/billing-preview', restrictTo('Admin'), billingController.getBillingPreview);
router.post('/generate-invoice', restrictTo('Admin'), billingController.generateInvoice);

// 3. Admin & Caretaker Shared Routes
router.get('/users/pending', restrictTo('Admin', 'Caretaker'), adminController.getPendingUsers);
router.get('/users', restrictTo('Admin', 'Caretaker'), adminController.getAllUsers);
router.patch('/verify-tenant/:tenantId', restrictTo('Admin', 'Caretaker'), tenantController.verifyAndLeaseTenant);
router.patch('/users/:userId/update-status', restrictTo('Admin', 'Caretaker'), adminController.updateUserStatus);

// 🟢 FIX: Point GET /admin/units to our updated propertyController query
router.get('/units', restrictTo('Admin', 'Caretaker'), propertyController.getUnits);

// 4. Strict Admin-Only Routes
router.patch('/units/:id/status', restrictTo('Admin'), unitController.updateUnitStatus);
router.patch('/users/:userId/status', restrictTo('Admin'), adminController.manageUserStatus);
router.delete('/tenants/:userId', restrictTo('Admin'), adminController.deleteTenant);
router.post('/properties', restrictTo('Admin'), adminController.createProperty);

// 🟢 FIX: Point POST /admin/units to our updated propertyController addUnit logic
router.post('/units', restrictTo('Admin'), propertyController.addUnit);

router.patch('/units/:id/billing', propertyController.updateUnitBilling);

module.exports = router;