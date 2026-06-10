const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// The route securely chains token generation right before initiating the real handshake
router.post('/initiate-payment', protect, paymentController.generateMpesaToken, paymentController.initiatePayment);
router.post('/callback', paymentController.mpesaCallback);

module.exports = router;