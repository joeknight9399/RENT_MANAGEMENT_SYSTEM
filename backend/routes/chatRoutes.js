const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const auth = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// 1. Start or join a conversation
router.post('/start', auth.protect, chatController.getOrCreateConversation);

// 2. Send a message (with optional file attachment)
router.post('/send', auth.protect, upload.single('attachment'), chatController.sendMessage);

// 3. Upload a file independently (if needed for profile/other features)
router.post('/upload', auth.protect, upload.single('file'), chatController.uploadFile);

// 4. Get message history
router.get('/messages/:conversationId', auth.protect, chatController.getMessages);

// 5. Delete a message
router.post('/delete', auth.protect, chatController.deleteMessage);

module.exports = router;