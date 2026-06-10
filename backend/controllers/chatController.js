const db = require('../config/db');
const { randomUUID } = require('crypto');

// 1. GET OR CREATE CONVERSATION
exports.getOrCreateConversation = async (req, res) => {
    const { targetUserId } = req.body;
    const currentUserId = req.user.id;
    console.log(">>> [DEBUG] Current User ID:", currentUserId);
    console.log(">>> [DEBUG] Target User ID from Body:", targetUserId);

    if (!targetUserId) {
        return res.status(400).json({ error: "targetUserId is required" });
    }

    try {
        // 1. Check if a DM conversation already exists
        const [existing] = await db.query(`
            SELECT c.id 
            FROM conversations c
            JOIN conversation_participants p1 ON c.id = p1.conversation_id
            JOIN conversation_participants p2 ON c.id = p2.conversation_id
            WHERE c.type = 'dm' 
            AND p1.user_id = ? 
            AND p2.user_id = ?
        `, [currentUserId, targetUserId]);

        if (existing.length > 0) {
            return res.status(200).json({ conversationId: existing[0].id });
        }

        // 2. Create the conversation
        const conversationId = randomUUID();
        await db.query("INSERT INTO conversations (id, type) VALUES (?, 'dm')", [conversationId]);

        // 3. Insert participants (Removed 'id' as it doesn't exist in your table)
        await db.query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)", [conversationId, currentUserId]);
        await db.query("INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)", [conversationId, targetUserId]);

        res.status(201).json({ conversationId });

    } catch (error) {
        console.error("CHAT INITIALIZATION ERROR:", error);
        res.status(500).json({
            error: "Failed to initialize conversation",
            message: error.message
        });
    }
};


// 2. FETCH MESSAGES
exports.getMessages = async (req, res) => {
    const { conversationId } = req.params;
    const currentUserId = req.user.id;

    try {
        const [messages] = await db.query(`
            SELECT m.*, 
            CONCAT(u.full_name, ' (', IFNULL(un.room_number, 'No Unit'), ')') AS sender_identifier
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN units un ON u.unit_id = un.id
            LEFT JOIN hidden_messages hm ON m.id = hm.message_id AND hm.user_id = ?
            WHERE m.conversation_id = ? 
            AND m.is_deleted = FALSE 
            AND hm.message_id IS NULL
            ORDER BY m.created_at ASC
        `, [currentUserId, conversationId]);

        res.status(200).json(messages);
    } catch (error) {
        console.error("FETCH MESSAGES ERROR:", error);
        res.status(500).json({
            error: "Failed to fetch messages",
            details: error.message
        });
    }
};

// 3. SEND MESSAGE (Updated with Real-time support)
exports.sendMessage = async (req, res) => {
    const { conversationId, content } = req.body;
    const senderId = req.user.id;

    try {
        const messageId = randomUUID(); // Generate UUID in code for consistency
        await db.query(
            `INSERT INTO messages (id, conversation_id, sender_id, content, created_at) 
             VALUES (?, ?, ?, ?, NOW())`,
            [messageId, conversationId, senderId, content]
        );

        const [rows] = await db.query(`
            SELECT m.*, 
            CONCAT(u.full_name, ' (', IFNULL(un.room_number, 'No Unit'), ')') AS sender_identifier
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            LEFT JOIN units un ON u.unit_id = un.id
            WHERE m.id = ?
        `, [messageId]);

        const newMessage = rows[0];

        // --- NEW: Emit to the specific conversation room ---
        if (req.io) {
            req.io.to(conversationId).emit('newMessage', newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.error("SEND MESSAGE ERROR:", error);
        res.status(500).json({ error: "Failed to send message", details: error.message });
    }
};

// 4. DELETE MESSAGE
exports.deleteMessage = async (req, res) => {
    const { messageId, deleteForEveryone } = req.body;
    const currentUserId = req.user.id;

    try {
        if (deleteForEveryone) {
            const [message] = await db.query("SELECT sender_id FROM messages WHERE id = ?", [messageId]);
            if (message.length > 0 && message[0].sender_id !== currentUserId) {
                return res.status(403).json({ error: "Unauthorized" });
            }

            await db.query("UPDATE messages SET is_deleted = TRUE WHERE id = ?", [messageId]);
            if (req.io) req.io.emit('messageDeleted', { messageId });
        } else {
            await db.query("INSERT INTO hidden_messages (user_id, message_id) VALUES (?, ?)",
                [currentUserId, messageId]);
        }
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ error: "Delete failed" });
    }
};

// 5. UPLOAD FILE
exports.uploadFile = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/chat/${req.file.filename}`;
    res.status(200).json({ fileUrl });
};