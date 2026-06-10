const express = require('express');
const router = express.Router();

// Controller
const billingController = require('../controllers/billingController');

// Middleware
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Protect all routes below
router.use(protect);

// Caretaker logging utility logs
router.post('/log-reading', restrictTo('Caretaker', 'Admin'), billingController.logUtilityReading);

// Tenant tracking their own invoices statement
router.get('/tenant-ledger', restrictTo('Tenant'), billingController.getTenantBillingLedger);

// ====================================================================
// REMOVE OR COMMENT OUT THE OLD LINE THAT LOOKED LIKE THIS:
// router.post('/manual-invoice', restrictTo('Admin'), billingController.createManualInvoice);
// ====================================================================

module.exports = router;