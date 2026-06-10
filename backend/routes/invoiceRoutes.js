// routes/invoiceRoutes.js
const express = require('express');
const router = express.Router();
const { createManualInvoice } = require('../controllers/invoiceController');

// POST route to trigger manual invoice generation
router.post('/generate-manual', createManualInvoice);

module.exports = router;