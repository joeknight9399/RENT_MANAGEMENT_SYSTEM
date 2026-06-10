import React, { useState, useEffect } from 'react';
import axios from 'axios';
import socket from '../socket'; // Your socket configuration file

const ChatWindow = ({ conversationId }) => {
    const [messages, setMessages] = useState([]);
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);

    // 1. Fetch history when the component loads
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const { data } = await axios.get(`/api/v1/chat/messages/${conversationId}`);
                setMessages(data);
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };

        // Join the socket room for this specific conversation
        socket.emit('joinRoom', conversationId);
        fetchMessages();

        // Listen for new messages in real-time
        socket.on('newMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        // Listen for deleted messages
        socket.on('messageDeleted', ({ messageId }) => {
            setMessages((prev) => prev.filter(m => m.id !== messageId));
        });

        return () => {
            socket.off('newMessage');
            socket.off('messageDeleted');
        };
    }, [conversationId]);

    // 2. Handle sending (Text + File)
    const handleSend = async (e) => {
        e.preventDefault();
        if (!text && !file) return;

        const formData = new FormData();
        formData.append('conversationId', conversationId);
        formData.append('content', text);
        if (file) formData.append('attachment', file); // 'attachment' must match backend middleware

        try {
            await axios.post('/api/v1/chat/send', formData);
            setText('');
            setFile(null);
        } catch (err) {
            alert("Failed to send message");
        }
    };

    return (
        <div className="chat-container">
            {/* Message List */}
            <div className="messages-list">
                {messages.map((m) => (
                    <div key={m.id} className="message-bubble">
                        <p><strong>{m.sender_identifier}:</strong> {m.content}</p>
                        {m.media_url && (
                            <img src={`http://localhost:5000${m.media_url}`} alt="media" style={{ maxWidth: '200px' }} />
                        )}
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend}>
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Type a message..."
                />
                <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
};

export default ChatWindow;