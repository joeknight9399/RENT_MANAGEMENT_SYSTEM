import React from 'react';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';

const TenantChatPage = () => {
    const { user } = useAuth();

    // In a real app, you would fetch this ID from the user's lease/profile 
    // or a list of active conversations.
    const conversationId = `tenant-${user?.id}`;

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6">
                <h1 className="text-xl font-black text-white uppercase tracking-tighter">Support & Maintenance</h1>
                <p className="text-slate-500 font-mono text-xs">Direct line to property management</p>
            </div>

            <Chat conversationId={conversationId} />
        </div>
    );
};

export default TenantChatPage;