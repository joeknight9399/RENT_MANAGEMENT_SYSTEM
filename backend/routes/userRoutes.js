const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const tenantController = require('../controllers/tenantController');
const paymentController = require('../controllers/paymentController');

// Add this temporary route at the very top of routes/userRoutes.js to test connectivity
router.get('/test-connection', (req, res) => {
    return res.status(200).send("User route file is connected perfectly!");
});

// Shielded Administrative Endpoints
router.get('/pending', protect, restrictTo('Admin'), userController.getPendingUsers);
router.patch('/:userId/status', protect, restrictTo('Admin'), userController.updateUserStatus);
router.post('/generate-invite', protect, restrictTo('Admin'), userController.generateCaretakerInvite);

// ─── TENANT PORTAL CORE ENDPOINTS ───
router.get('/tenant-overview', protect, tenantController.getTenantOverview);
router.get('/maintenance-tickets', protect, tenantController.getMaintenanceTickets);
router.post('/maintenance-tickets', protect, tenantController.createMaintenanceTicket);
router.get('/billing-history', protect, tenantController.getBillingHistory);
router.post('/initiate-payment', protect, paymentController.initiatePayment);

module.exports = router;