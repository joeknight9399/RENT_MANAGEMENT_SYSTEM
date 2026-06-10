import React from 'react';
import Chat from '../components/Chat';
import { useAuth } from '../context/AuthContext';

const TenantChatPage = () => {
    const { user } = useAuth();
    const conversationId = `tenant-${user?.id}`;

    return (
        <div className="h-full flex flex-col p-6">
            <h1 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Support & Maintenance</h1>
            <Chat conversationId={conversationId} />
        </div>
    );
};

export default TenantChatPage;