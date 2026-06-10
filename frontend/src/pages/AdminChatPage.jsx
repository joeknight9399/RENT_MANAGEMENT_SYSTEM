import React, { useState } from 'react';
import Chat from '../components/Chat';

const AdminChatPage = () => {
    const [activeConversation, setActiveConversation] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const allConversations = [
        { id: 'tenant-1', name: 'John Doe', property: 'Meru Heights A' },
        { id: 'tenant-2', name: 'Jane Smith', property: 'Meru Heights B' },
    ];

    return (
        <div className="h-[calc(100vh-100px)] flex gap-6 p-6">
            <div className="w-1/4 bg-[#0a0a0a] border border-slate-900 rounded-2xl flex flex-col">
                <div className="p-4 border-b border-slate-900">
                    <input
                        type="text"
                        placeholder="Search tenants..."
                        className="w-full bg-slate-950 border border-slate-900 rounded-xl px-3 py-2 text-xs text-white"
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex-1 overflow-y-auto">
                    {allConversations.map(c => (
                        <button key={c.id} onClick={() => setActiveConversation(c.id)} className="w-full text-left p-4 hover:bg-slate-900/40 border-b border-slate-900/50">
                            <p className="text-sm font-bold text-white">{c.name}</p>
                            <p className="text-[10px] text-slate-500">{c.property}</p>
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1">
                {activeConversation ? <Chat conversationId={activeConversation} /> : <div className="text-slate-500">Select a chat</div>}
            </div>
        </div>
    );
};

export default AdminChatPage;