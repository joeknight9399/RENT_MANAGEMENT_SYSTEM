const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoice.controller');

// Bring in your authentication protection middleware
// (Adjust the path and variable names below to match your exact auth middleware file)
const { protect, restrictTo } = require('../middleware/auth.middleware');

// ==========================================
// Caretaker / Admin Operations
// ==========================================

// Route 1: Record utility meter readings
router.post(
    '/log-utility',
    protect,
    restrictTo('Caretaker'),
    invoiceController.logUtilityReading
);

// Route 2: Generate monthly combined invoice statements
router.post(
    '/generate',
    protect,
    restrictTo('Admin', 'Caretaker'),
    invoiceController.generateMonthlyInvoice
);

// ==========================================
// Tenant Dedicated Portal Operations
// ==========================================

// Route 3: Fetch statement of account for the logged-in tenant
router.get(
    '/tenant-ledger',
    protect,
    restrictTo('Tenant'),
    invoiceController.getTenantBillingLedger
);

module.exports = router;