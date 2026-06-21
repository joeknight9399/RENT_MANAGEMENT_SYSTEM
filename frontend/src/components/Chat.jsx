import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import api from '../api'; // 🌟 Migrated to your centralized, authenticated Axios client
import { useAuth } from '../context/AuthContext';

// Dynamic environment routing for WebSockets
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Target the root backend service container directly (omit the /api/v1 prefix for sockets)
const SOCKET_URL = isProduction
    ? 'https://rentmanagementsystem-production.up.railway.app'
    : 'http://localhost:5000';

const socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    withCredentials: true
});

const Chat = ({ conversationId }) => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    // 1. Fetch History & Join Socket Room
    useEffect(() => {
        if (!conversationId) return;

        // Join the specific conversation room
        socket.emit('joinRoom', conversationId);

        // Fetch messages via unified API engine
        const fetchMessages = async () => {
            try {
                // baseURL handles the '/api/v1' prefix automatically
                const res = await api.get(`/chat/messages/${conversationId}`);
                setMessages(res.data);
            } catch (err) {
                console.error("Error fetching messages:", err);
            }
        };

        fetchMessages();

        // Listen for new messages
        socket.on('newMessage', (msg) => {
            setMessages((prev) => [...prev, msg]);
        });

        return () => {
            socket.off('newMessage');
            socket.emit('leaveRoom', conversationId);
        };
    }, [conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 2. Send Message
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            // Outbound payloads are authenticated automatically by the request interceptor
            await api.post('/chat/send', {
                conversationId,
                content: newMessage
            });
            setNewMessage(''); // Clear input
        } catch (err) {
            console.error("Error sending message:", err);
        }
    };

    return (
        <div className="flex flex-col h-[600px] bg-[#0a0a0a] border border-slate-900 rounded-2xl overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex flex-col ${msg.sender_id === user?.id ? 'items-end' : 'items-start'}`}
                    >
                        <div className={`max-w-[70%] p-3 rounded-2xl text-sm ${msg.sender_id === user?.id
                            ? 'bg-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-900 text-slate-300 rounded-bl-none'
                            }`}>
                            <p className="text-[10px] opacity-70 mb-1">{msg.sender_identifier}</p>
                            {msg.content}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 border-t border-slate-900 bg-[#050505]">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-slate-950 border border-slate-900 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 text-white"
                    />
                    <button
                        type="submit"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-bold transition-all"
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Chat;