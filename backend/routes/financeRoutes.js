// 📁 routes/financeRoutes.js
const express = require('express');
const router = express.Router();
const { getFinancialSummary, getInvoiceLedger } = require('../controllers/financeController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.use(protect, restrictTo('Admin'));

// Mount the dashboard metrics endpoint
// Full URL: GET /api/v1/finance/summary
router.get('/summary', getFinancialSummary);

// Mount the detailed member tracking ledger endpoint
// Full URL: GET /api/v1/finance/ledger
router.get('/ledger', getInvoiceLedger);

module.exports = router;
