const express = require('express');
const router = express.Router();
const maintenanceController = require('../controllers/maintenanceController');
// Assuming you have a protect/auth middleware in your project
const { protect } = require('../middleware/authMiddleware');

// Routes
// GET /api/maintenance - Fetch all tickets for the logged-in user
// POST /api/maintenance - Submit a new ticket
router.route('/')
    .get(protect, maintenanceController.getTickets)
    .post(protect, maintenanceController.createTicket);

module.exports = router;