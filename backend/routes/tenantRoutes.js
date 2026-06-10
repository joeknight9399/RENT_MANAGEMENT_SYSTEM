const express = require('express');
const router = express.Router();
const { getTenantAnnouncements } = require('../controllers/tenantController');
const { protect } = require('../middleware/authMiddleware'); // Your JWT auth guard

// Route for tenants to read announcements
router.get('/broadcasts', protect, getTenantAnnouncements);

module.exports = router;