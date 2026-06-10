const express = require('express');
const router = express.Router();
const inviteController = require('../controllers/inviteController');

// Import your existing authorization guards
const { protect, restrictTo } = require('../middleware/authMiddleware');

// Mount the route behind security guards so only authorized managers can print room access keys
router.post(
    '/tenant',
    protect,
    restrictTo('Admin', 'Caretaker'),
    inviteController.generateTenantInvite
);

module.exports = router;