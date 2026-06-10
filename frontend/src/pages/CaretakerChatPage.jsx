import React, { useState } from 'react';
// Corrected import: '..' goes from /pages to /src, then enters /components
import Chat from '../components/Chat';

const CaretakerChatPage = () => {
    const [activeConversation, setActiveConversation] = useState(null);

    // Mock data for Caretaker dashboard
    const tenants = [
        { id: 'tenant-1', name: 'John Doe', room: 'A-101' },
        { id: 'tenant-2', name: 'Jane Smith', room: 'B-202' }
    ];

    return (
        <div className="flex h-[calc(100vh-100px)] gap-6 p-6">
            {/* Sidebar list */}
            <div className="w-1/3 bg-[#0a0a0a] border border-slate-900 rounded-2xl p-4">
                <h2 className="text-white font-bold mb-4 uppercase text-xs">Active Tenant Chats</h2>
                <div className="space-y-2">
                    {tenants.map(tenant => (
                        <button
                            key={tenant.id}
                            onClick={() => setActiveConversation(tenant.id)}
                            className="w-full text-left p-3 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-all"
                        >
                            <p className="text-sm font-bold text-white">{tenant.name}</p>
                            <p className="text-[10px] text-slate-500 font-mono">Room {tenant.room}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1">
                {activeConversation ? (
                    <Chat conversationId={activeConversation} />
                ) : (
                    <div className="h-full flex items-center justify-center bg-[#0a0a0a] border border-slate-900 rounded-2xl text-slate-500">
                        Select a tenant to start messaging
                    </div>
                )}
            </div>
        </div>
    );
};

export default CaretakerChatPage;